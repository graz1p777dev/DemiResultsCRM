'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { HistoryPoint, NetworkHistoryPoint } from '@/types/server-status'
import { formatBytesPerSec } from './format'

const TIP = { fontSize: 11, borderRadius: 8, border: '1px solid #ebebee' }
const TICK = { fontSize: 10, fill: '#a2b4c0' }
const MARGIN = { top: 4, right: 4, left: -16, bottom: 0 }
const H = 180

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <h3 className="font-semibold text-sm mb-3" style={{ color: '#0c2136' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center" style={{ height: H, color: '#b3bcc5', fontSize: 12 }}>
      Пока недостаточно данных — соберём за несколько измерений
    </div>
  )
}

export function CpuHistoryChart({ data }: { data: HistoryPoint[] }) {
  return (
    <ChartCard title="CPU за последние измерения">
      {data.length < 2 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={data} margin={MARGIN}>
            <defs>
              <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" vertical={false} />
            <XAxis dataKey="time" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={TICK} tickLine={false} axisLine={false} domain={[0, 100]} width={30} />
            <Tooltip contentStyle={TIP} formatter={(v) => [`${v}%`, 'CPU']} />
            <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#cpuFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

export function RamHistoryChart({ data }: { data: HistoryPoint[] }) {
  return (
    <ChartCard title="RAM за последние измерения">
      {data.length < 2 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={data} margin={MARGIN}>
            <defs>
              <linearGradient id="ramFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" vertical={false} />
            <XAxis dataKey="time" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={TICK} tickLine={false} axisLine={false} domain={[0, 100]} width={30} />
            <Tooltip contentStyle={TIP} formatter={(v) => [`${v}%`, 'RAM']} />
            <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="url(#ramFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

export function NetworkHistoryChart({ data }: { data: NetworkHistoryPoint[] }) {
  return (
    <ChartCard title="Сеть: входящий / исходящий трафик">
      {data.length < 2 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={H}>
          <ComposedChart data={data} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" vertical={false} />
            <XAxis dataKey="time" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={TICK} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => formatBytesPerSec(v)} />
            <Tooltip
              contentStyle={TIP}
              formatter={(v, key) => [formatBytesPerSec(Number(v)), key === 'in' ? 'Входящий' : 'Исходящий']}
            />
            <Line type="monotone" dataKey="in" stroke="#16a34a" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="out" stroke="#ea580c" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

export function ChartCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 animate-pulse">
      <div className="h-4 w-48 rounded mb-4" style={{ backgroundColor: '#f1f2f4' }} />
      <div className="rounded-xl" style={{ height: H, backgroundColor: '#f5f6f8' }} />
    </div>
  )
}
