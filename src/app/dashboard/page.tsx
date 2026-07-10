import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDayGreeting } from '@/lib/formatters'
import LeftPanel from '@/components/dashboard/LeftPanel'
import LeftPanelSkeleton from '@/components/dashboard/LeftPanelSkeleton'
import RightPanel from '@/components/dashboard/RightPanel'
import RightPanelSkeleton from '@/components/dashboard/RightPanelSkeleton'

export const metadata = { title: 'Дашборд — Demi Results' }

export default async function DashboardPage() {
  // Пока Supabase не настроен — дашборд бизнес-метрик недоступен
  if (process.env.AUTH_BYPASS === '1') redirect('/dashboard/dialogs')

  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  // access_token передаётся в LeftPanel/RightPanel как строка (serializable),
  // чтобы они не вызывали cookies() внутри Suspense во время стриминга.
  const accessToken = session?.access_token ?? null

  let role = 'mp'
  let permissionLevel = 'employee'
  let employeeId: string | undefined
  let departmentId: string | null = null

  if (session?.user) {
    const [{ data: emp }, { data: permLevel }] = await Promise.all([
      supabase
        .from('employees')
        .select('id, role, department_id')
        .eq('user_id', session.user.id)
        .single(),
      // get_my_permission_level() — SECURITY DEFINER функция из migration 025
      supabase.rpc('get_my_permission_level'),
    ])

    if (emp) {
      role = emp.role as string
      employeeId = emp.id as string
      departmentId = emp.department_id as string | null
    }
    if (permLevel) {
      permissionLevel = permLevel as string
    } else {
      // Фолбэк для системных ролей (если миграция ещё не применена)
      const SYSTEM_LEVELS: Record<string, string> = {
        owner: 'owner', rop: 'department_head',
        mp: 'employee', lmai: 'employee', accountant: 'accountant',
      }
      permissionLevel = SYSTEM_LEVELS[role] ?? 'employee'
    }
  }

  // Бухгалтер видит только финансы
  if (permissionLevel === 'accountant') redirect('/dashboard/finance')

  // Нет сессии — middleware должен поймать раньше, но на всякий случай
  if (!accessToken) redirect('/auth/login')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const greeting = getDayGreeting()

  const dateStr = now.toISOString().substring(0, 10)
  const dayLabel = now.toLocaleString('ru-RU', { day: 'numeric', month: 'long' })
  const monthLabel = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })

  return (
    <div className="flex" style={{ height: 'calc(100vh - 52px)' }}>

      {/* ── Левая панель: итоги месяца ── */}
      <div
        className="flex flex-col overflow-y-auto glass"
        style={{
          borderTop: 'none',
          borderLeft: 'none',
          borderBottom: 'none',
          borderRight: '1px solid rgba(124,58,237,0.08)',
          minWidth: 0,
          width: '55%',
        }}
      >
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <p style={{ fontSize: 12, color: '#a2b4c0' }}>
            {greeting} · {monthLabel}
          </p>
          <h2 className="font-bold mt-0.5" style={{ fontSize: 18, color: '#0c2136' }}>
            Итоги месяца
          </h2>
        </div>

        <Suspense fallback={<LeftPanelSkeleton />}>
          <LeftPanel
            year={year}
            month={month}
            employeeId={employeeId}
            role={role}
            permissionLevel={permissionLevel}
            accessToken={accessToken}
          />
        </Suspense>
      </div>

      {/* ── Правая панель: сегодня ── */}
      <div
        className="flex flex-col overflow-y-auto"
        style={{
          minWidth: 0,
          width: '45%',
        }}
      >
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <p style={{ fontSize: 12, color: '#a2b4c0' }}>Сегодня</p>
          <h2 className="font-bold mt-0.5" style={{ fontSize: 18, color: '#0c2136' }}>
            {dayLabel}
          </h2>
        </div>

        <Suspense fallback={<RightPanelSkeleton />}>
          <RightPanel
            dateStr={dateStr}
            role={role}
            permissionLevel={permissionLevel}
            employeeId={employeeId}
            departmentId={departmentId}
            accessToken={accessToken}
          />
        </Suspense>
      </div>
    </div>
  )
}
