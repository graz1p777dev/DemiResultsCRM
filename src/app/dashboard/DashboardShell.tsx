'use client'
import { useEffect, useTransition } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { stopImpersonation } from '@/actions/auth'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, impersonating } = useAuth()
  const [pending, startTransition] = useTransition()

  // Сессия истекла прямо во время работы пользователя — перенаправляем на логин.
  // При первом рендере user всегда установлен (данные пришли с сервера),
  // поэтому это срабатывает только при реальном logout/expiry.
  useEffect(() => {
    if (!user) {
      window.location.href = '/auth/login'
    }
  }, [user])

  if (!user) return null

  const handleExitImpersonation = () => {
    startTransition(async () => {
      await stopImpersonation()
      window.location.href = '/dashboard/employees'
    })
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f5f6f8' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {impersonating && (
          <div
            className="flex items-center justify-between px-4 py-2 text-sm font-medium shrink-0"
            style={{ backgroundColor: '#f59e0b', color: '#0c2136' }}
          >
            <span>
              👤 Вы просматриваете систему от имени <strong>{impersonating.name}</strong> ({impersonating.role})
            </span>
            <button
              onClick={handleExitImpersonation}
              disabled={pending}
              className="ml-4 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: 'rgba(12,33,54,0.15)' }}
            >
              {pending ? '...' : '← Выйти в свой аккаунт'}
            </button>
          </div>
        )}
        <Topbar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
