import os from 'node:os'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  ServerStatusResponse,
  ServiceStatusItem,
  ProcessRow,
  HistoryPoint,
  NetworkHistoryPoint,
} from '@/types/server-status'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Авторизация ─────────────────────────────────────────────────────────────
// Роль хранится в public.employees (та же таблица, что использует useAuth()
// на клиенте) — страница /dashboard/server-status тоже проверяет роль, но это
// не защищает сам API-роут: middleware.ts матчит только /dashboard/:path* и
// /auth/:path*, поэтому /api/server/status без этой проверки был бы открыт
// всем, у кого есть ссылка.
async function isOwner(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('employees')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  return data?.role === 'owner'
}

// ─── История в памяти процесса ──────────────────────────────────────────────
// Ring-buffer на уровне модуля: живёт, пока жив Node-процесс (Railway не
// перезапускает контейнер между запросами), поэтому графики "за последние
// измерения" копятся сами по себе без базы данных.
const HISTORY_LIMIT = 60 // ~5 минут при опросе раз в 5 секунд

const cpuHistory: HistoryPoint[] = []
const ramHistory: HistoryPoint[] = []
const networkHistory: NetworkHistoryPoint[] = []

function pushHistory(cpuPercent: number, ramPercent: number, netIn: number, netOut: number) {
  const time = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  cpuHistory.push({ time, value: cpuPercent })
  ramHistory.push({ time, value: ramPercent })
  networkHistory.push({ time, in: netIn, out: netOut })
  if (cpuHistory.length > HISTORY_LIMIT) cpuHistory.shift()
  if (ramHistory.length > HISTORY_LIMIT) ramHistory.shift()
  if (networkHistory.length > HISTORY_LIMIT) networkHistory.shift()
}

// ─── CPU ─────────────────────────────────────────────────────────────────────

function cpuSnapshot() {
  return os.cpus().map((c) => ({
    idle: c.times.idle,
    total: c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq,
  }))
}

async function getCpuPercent(sampleMs = 200): Promise<number> {
  const start = cpuSnapshot()
  await new Promise((r) => setTimeout(r, sampleMs))
  const end = cpuSnapshot()

  let idleDiff = 0
  let totalDiff = 0
  for (let i = 0; i < start.length; i++) {
    idleDiff += end[i].idle - start[i].idle
    totalDiff += end[i].total - start[i].total
  }
  if (totalDiff <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)))
}

function getCpuTemperature(): number | null {
  try {
    const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8')
    const milliC = Number(raw.trim())
    if (!Number.isFinite(milliC)) return null
    return Math.round(milliC / 1000)
  } catch {
    // Контейнеры обычно не видят термодатчики хоста — это ожидаемо, не ошибка.
    return null
  }
}

// ─── Диск ────────────────────────────────────────────────────────────────────

function getDisk(): { total: number | null; used: number | null; percent: number | null } {
  try {
    const out = execSync('df -k /', { encoding: 'utf8', timeout: 3000 })
    const line = out.trim().split('\n')[1]
    const parts = line.split(/\s+/)
    const totalKb = Number(parts[1])
    const usedKb = Number(parts[2])
    if (!Number.isFinite(totalKb) || !Number.isFinite(usedKb) || totalKb <= 0) {
      return { total: null, used: null, percent: null }
    }
    const total = totalKb * 1024
    const used = usedKb * 1024
    return { total, used, percent: Math.round((used / total) * 100) }
  } catch {
    return { total: null, used: null, percent: null }
  }
}

// ─── Сеть ────────────────────────────────────────────────────────────────────

function readNetTotals(): { rx: number; tx: number } {
  const raw = fs.readFileSync('/proc/net/dev', 'utf8')
  const lines = raw.split('\n').slice(2)
  let rx = 0
  let tx = 0
  for (const line of lines) {
    const [ifacePart, rest] = line.split(':')
    if (!rest) continue
    if (ifacePart.trim() === 'lo') continue
    const fields = rest.trim().split(/\s+/).map(Number)
    rx += fields[0] || 0
    tx += fields[8] || 0
  }
  return { rx, tx }
}

async function getNetworkRates(
  sampleMs = 500
): Promise<{ inBytesPerSec: number | null; outBytesPerSec: number | null }> {
  try {
    const start = readNetTotals()
    await new Promise((r) => setTimeout(r, sampleMs))
    const end = readNetTotals()
    return {
      inBytesPerSec: Math.max(0, Math.round((end.rx - start.rx) / (sampleMs / 1000))),
      outBytesPerSec: Math.max(0, Math.round((end.tx - start.tx) / (sampleMs / 1000))),
    }
  } catch {
    // /proc/net/dev недоступен вне Linux/контейнера — не считаем это ошибкой сервиса.
    return { inBytesPerSec: null, outBytesPerSec: null }
  }
}

// ─── Процессы ────────────────────────────────────────────────────────────────

function mapProcessStat(stat: string): string {
  switch (stat[0]) {
    case 'R':
      return 'running'
    case 'S':
      return 'sleeping'
    case 'D':
      return 'waiting'
    case 'Z':
      return 'zombie'
    case 'T':
      return 'stopped'
    default:
      return 'unknown'
  }
}

function getProcesses(): ProcessRow[] {
  try {
    const out = execSync('ps -eo pid,comm,%cpu,%mem,stat --sort=-%cpu', {
      encoding: 'utf8',
      timeout: 3000,
    })
    const lines = out.trim().split('\n').slice(1, 11)
    return lines
      .map((line): ProcessRow | null => {
        const match = line.trim().match(/^(\d+)\s+(\S+)\s+([\d.]+)\s+([\d.]+)\s+(\S+)$/)
        if (!match) return null
        const [, pid, name, cpu, ram, stat] = match
        return {
          pid: Number(pid),
          name,
          cpu: Number(cpu),
          ram: Number(ram),
          status: mapProcessStat(stat),
        }
      })
      .filter((p): p is ProcessRow => p !== null)
  } catch {
    // `ps` может отсутствовать в минимальном образе — пустой список, не ошибка.
    return []
  }
}

// ─── IP ──────────────────────────────────────────────────────────────────────

function getLocalIp(): string | null {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return null
}

let cachedPublicIp: { ip: string | null; fetchedAt: number } = { ip: null, fetchedAt: 0 }
const PUBLIC_IP_TTL_MS = 5 * 60 * 1000

async function getPublicIp(): Promise<string | null> {
  const now = Date.now()
  if (now - cachedPublicIp.fetchedAt < PUBLIC_IP_TTL_MS) return cachedPublicIp.ip
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: { ip?: string } = await res.json()
    cachedPublicIp = { ip: data.ip ?? null, fetchedAt: now }
  } catch {
    // Оставляем последний известный IP, просто не обновляем метку времени успеха.
    cachedPublicIp = { ip: cachedPublicIp.ip, fetchedAt: now }
  }
  return cachedPublicIp.ip
}

// ─── Проверки сервисов ───────────────────────────────────────────────────────

async function checkSupabase(): Promise<ServiceStatusItem> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const name = 'PostgreSQL (Supabase)'
  if (!url || !key) {
    return { name, status: 'unknown', description: 'Переменные окружения не заданы' }
  }
  try {
    const start = Date.now()
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    const ms = Date.now() - start
    if (res.ok || res.status === 404) {
      return { name, status: ms > 1500 ? 'warning' : 'online', description: `Отвечает за ${ms} мс` }
    }
    return { name, status: 'warning', description: `HTTP ${res.status}` }
  } catch {
    return { name, status: 'offline', description: 'Нет ответа' }
  }
}

async function checkBotBackend(): Promise<ServiceStatusItem> {
  const base = process.env.BOT_BACKEND_API_URL
  const name = 'AI Бот'
  if (!base) {
    return { name, status: 'unknown', description: 'BOT_BACKEND_API_URL не задан' }
  }
  try {
    const start = Date.now()
    const res = await fetch(`${base.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    const ms = Date.now() - start
    if (res.ok) {
      return { name, status: ms > 1500 ? 'warning' : 'online', description: `Отвечает за ${ms} мс` }
    }
    return { name, status: 'warning', description: `HTTP ${res.status}` }
  } catch {
    return { name, status: 'offline', description: 'Бэкенд недоступен' }
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET() {
  if (!(await isOwner())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [cpuPercent, netRates, supabaseCheck, botCheck, publicIp] = await Promise.all([
    getCpuPercent(),
    getNetworkRates(),
    checkSupabase(),
    checkBotBackend(),
    getPublicIp(),
  ])

  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const ramPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0

  pushHistory(cpuPercent, ramPercent, netRates.inBytesPerSec ?? 0, netRates.outBytesPerSec ?? 0)

  const services: ServiceStatusItem[] = [
    { name: 'Backend/API', status: 'online', description: 'Next.js сервер отвечает' },
    supabaseCheck,
    {
      name: 'Redis',
      status: 'unknown',
      description: 'Используется bot-бэкендом, не отслеживается из этого приложения',
    },
    {
      name: 'Nginx',
      status: 'unknown',
      description: 'Не используется в этой инфраструктуре (Railway/Vercel)',
    },
    { name: 'Docker', status: 'online', description: 'Контейнер работает (Railway)' },
    botCheck,
  ]

  const body: ServerStatusResponse = {
    cpu: { percent: cpuPercent, temperature: getCpuTemperature() },
    ram: { total: totalMem, used: usedMem, percent: ramPercent },
    disk: getDisk(),
    uptimeSeconds: Math.round(os.uptime()),
    loadAverage: os.loadavg() as [number, number, number],
    network: netRates,
    ip: { public: publicIp, local: getLocalIp() },
    services,
    processes: getProcesses(),
    history: { cpu: cpuHistory, ram: ramHistory, network: networkHistory },
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json(body)
}
