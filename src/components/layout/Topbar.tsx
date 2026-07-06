'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getInitials, formatDateFull } from '@/lib/formatters'
import { ROLE_LABELS } from '@/lib/constants'
import type { UserRole } from '@/types'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/dashboard/consultations': 'Записи на консультацию',
  '/dashboard/decomposition': 'Декомпозиция',
  '/dashboard/salary': 'Зарплата',
  '/dashboard/finance': 'Финансы',
  '/dashboard/employees': 'Сотрудники',
  '/dashboard/calendar': 'Рабочий календарь',
  '/dashboard/notifications': 'Уведомления',
  '/dashboard/documents': 'Документы',
  '/dashboard/settings': 'Настройки',
  '/dashboard/integrations': 'Интеграции',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 3) {
    const base = '/' + segments.slice(0, 2).join('/')
    return PAGE_TITLES[base] ? PAGE_TITLES[base] + ' / Детали' : 'Страница'
  }
  return 'Страница'
}

export default function Topbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  const role = user?.role as UserRole | undefined
  const today = formatDateFull(new Date().toISOString())

  useEffect(() => {
    if (!user?.id) return

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count ?? 0)
    }

    fetchUnread()

    const channel = supabase
      .channel('topbar-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `employee_id=eq.${user.id}`,
        },
        () => fetchUnread()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, supabase])

  return (
    <header
      className="flex-shrink-0 flex items-center px-5 gap-4"
      style={{
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Хлебные крошки */}
      <div className="flex-1 min-w-0">
        <h1
          className="font-semibold truncate"
          style={{ fontSize: 14, color: '#0c2136' }}
        >
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Правая часть */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Дата */}
        {today && (
          <span
            className="hidden sm:block"
            style={{ fontSize: 12, color: '#a2b4c0' }}
          >
            {today}
          </span>
        )}

        {/* Индикатор онлайн */}
        <div className="flex items-center gap-1.5">
          <div
            className="rounded-full"
            style={{ width: 7, height: 7, backgroundColor: '#16a34a' }}
          />
          <span style={{ fontSize: 12, color: '#6b7280' }} className="hidden sm:block">
            Онлайн
          </span>
        </div>

        {/* Колокол */}
        <Link
          href="/dashboard/notifications"
          className="relative flex items-center justify-center rounded-md transition-colors"
          style={{ width: 32, height: 32, color: '#6b7280' }}
          title="Уведомления"
        >
          <Bell style={{ width: 16, height: 16 }} />
          {unreadCount > 0 && (
            <span
              className="absolute flex items-center justify-center text-white font-bold"
              style={{
                top: 4, right: 4,
                minWidth: 14, height: 14,
                backgroundColor: '#dc2626',
                borderRadius: 7,
                fontSize: 9,
                lineHeight: 1,
                padding: '0 3px',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Аватар пользователя */}
        <div
          className="flex items-center gap-2 cursor-default"
          title={role ? ROLE_LABELS[role] : ''}
        >
          <div
            className="flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0"
            style={{
              width: 28, height: 28,
              backgroundColor: '#0c4d6c',
              fontSize: 10,
            }}
          >
            {user?.name ? getInitials(user.name) : '??'}
          </div>
          <span
            className="hidden md:block font-medium"
            style={{ fontSize: 12, color: '#0c2136', maxWidth: 100 }}
          >
            {user?.name?.split(' ')[0] ?? ''}
          </span>
        </div>
      </div>
    </header>
  )
}
