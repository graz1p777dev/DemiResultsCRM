'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { getInitials } from '@/lib/formatters'
import { NAV_GROUPS } from '@/config/nav'
import { LogOut } from 'lucide-react'
import type { UserRole } from '@/types'

const NAV_ICON_TONES: Record<string, { bg: string; soft: string; fg: string }> = {
  '/dashboard': {
    bg: 'linear-gradient(135deg,#2563eb 0%,#0c4d6c 100%)',
    soft: 'rgba(37,99,235,0.18)',
    fg: '#bfdbfe',
  },
  '/dashboard/consultations': {
    bg: 'linear-gradient(135deg,#0f766e 0%,#14b8a6 100%)',
    soft: 'rgba(20,184,166,0.18)',
    fg: '#99f6e4',
  },
  '/dashboard/dialogs': {
    bg: 'linear-gradient(135deg,#7c3aed 0%,#2563eb 100%)',
    soft: 'rgba(124,58,237,0.18)',
    fg: '#ddd6fe',
  },
  '/dashboard/bot-analytics': {
    bg: 'linear-gradient(135deg,#0c4d6c 0%,#10b981 100%)',
    soft: 'rgba(16,185,129,0.18)',
    fg: '#bbf7d0',
  },
  '/dashboard/bot-reports': {
    bg: 'linear-gradient(135deg,#0891b2 0%,#2563eb 100%)',
    soft: 'rgba(8,145,178,0.18)',
    fg: '#a5f3fc',
  },
  '/dashboard/bot-settings': {
    bg: 'linear-gradient(135deg,#475569 0%,#111827 100%)',
    soft: 'rgba(148,163,184,0.18)',
    fg: '#cbd5e1',
  },
  '/dashboard/laboratory': {
    bg: 'linear-gradient(135deg,#db2777 0%,#7c3aed 100%)',
    soft: 'rgba(219,39,119,0.18)',
    fg: '#fbcfe8',
  },
  '/dashboard/decomposition': {
    bg: 'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)',
    soft: 'rgba(245,158,11,0.18)',
    fg: '#fde68a',
  },
  '/dashboard/salary': {
    bg: 'linear-gradient(135deg,#16a34a 0%,#0c4d6c 100%)',
    soft: 'rgba(34,197,94,0.18)',
    fg: '#bbf7d0',
  },
  '/dashboard/finance': {
    bg: 'linear-gradient(135deg,#0c2136 0%,#0c4d6c 52%,#15b981 100%)',
    soft: 'rgba(21,185,129,0.18)',
    fg: '#b8f7de',
  },
  '/dashboard/marketing': {
    bg: 'linear-gradient(135deg,#ec4899 0%,#7c3aed 100%)',
    soft: 'rgba(236,72,153,0.18)',
    fg: '#fbcfe8',
  },
  '/dashboard/employees': {
    bg: 'linear-gradient(135deg,#6366f1 0%,#0c4d6c 100%)',
    soft: 'rgba(99,102,241,0.18)',
    fg: '#c7d2fe',
  },
  '/dashboard/calendar': {
    bg: 'linear-gradient(135deg,#06b6d4 0%,#0f766e 100%)',
    soft: 'rgba(6,182,212,0.18)',
    fg: '#cffafe',
  },
  '/dashboard/notifications': {
    bg: 'linear-gradient(135deg,#f97316 0%,#ef4444 100%)',
    soft: 'rgba(249,115,22,0.18)',
    fg: '#fed7aa',
  },
  '/dashboard/documents': {
    bg: 'linear-gradient(135deg,#64748b 0%,#0c2136 100%)',
    soft: 'rgba(100,116,139,0.18)',
    fg: '#e2e8f0',
  },
  '/dashboard/settings': {
    bg: 'linear-gradient(135deg,#334155 0%,#0c4d6c 100%)',
    soft: 'rgba(51,65,85,0.26)',
    fg: '#cbd5e1',
  },
}

function isActiveLink(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const role = user?.role as UserRole | undefined

  // Скользящая подсветка активного пункта
  const itemRefs = useRef<Map<string, HTMLAnchorElement | null>>(new Map())
  const [indicator, setIndicator] = useState<{ top: number; height: number; visible: boolean }>({
    top: 0, height: 0, visible: false,
  })
  const [animate, setAnimate] = useState(false)

  const activeHref = (() => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (role && item.roles.includes(role) && isActiveLink(pathname, item.href, item.exact)) {
          return item.href
        }
      }
    }
    return null
  })()
  const activeTone = activeHref ? (NAV_ICON_TONES[activeHref] ?? NAV_ICON_TONES['/dashboard']) : null

  useLayoutEffect(() => {
    const el = activeHref ? itemRefs.current.get(activeHref) : null
    if (el) {
      setIndicator({ top: el.offsetTop, height: el.offsetHeight, visible: true })
      // включаем плавность только после первой установки позиции
      const id = requestAnimationFrame(() => setAnimate(true))
      return () => cancelAnimationFrame(id)
    } else {
      setIndicator(prev => ({ ...prev, visible: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref, role])

  // На мобильном: закрывать drawer при переходе на другую страницу
  useEffect(() => {
    onClose?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <aside
      className={cn(
        'flex flex-col flex-shrink-0 h-screen overflow-hidden',
        // Мобильный: фиксированный drawer, скрыт за левым краем; десктоп: обычный sticky
        'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out',
        'md:sticky md:top-0 md:z-auto md:translate-x-0 md:transition-none',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
      )}
      style={{ width: 192, backgroundColor: '#0c1f33' }}
    >
      {/* Логотип */}
      <div
        className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 32, height: 32,
            backgroundColor: '#0c4d6c',
          }}
        >
          <span className="text-white font-bold" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
            DR
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold truncate" style={{ fontSize: 13 }}>
            Demi Results
          </p>
          <p style={{ fontSize: 11, color: '#a2b4c0' }} className="truncate">
            CRM система
          </p>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: 'none' }}>
        <div className="relative">
          {/* Скользящая подсветка */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: indicator.top,
              height: indicator.height,
              background: activeTone?.bg ?? '#0c4d6c',
              borderRadius: 6,
              boxShadow: activeTone ? `0 6px 16px ${activeTone.soft}` : 'none',
              opacity: indicator.visible ? 1 : 0,
              transition: animate
                ? 'top 260ms cubic-bezier(0.22,1,0.36,1), height 260ms cubic-bezier(0.22,1,0.36,1), opacity 150ms ease'
                : 'opacity 150ms ease',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {NAV_GROUPS.map((group) => {
            const visible = group.items.filter(
              (item) => role && item.roles.includes(role)
            )
            if (!visible.length) return null

            return (
              <div key={group.label} className="mb-5">
                <p
                  className="px-2 mb-1 uppercase tracking-widest font-semibold"
                  style={{ fontSize: 10, color: '#4a6075' }}
                >
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {visible.map((item) => {
                    const active = isActiveLink(pathname, item.href, item.exact)
                    const Icon = item.icon
                    const tone = NAV_ICON_TONES[item.href] ?? NAV_ICON_TONES['/dashboard']

                    return (
                      <li key={item.href}>
                        <Link
                          ref={(el) => { itemRefs.current.set(item.href, el) }}
                          href={item.href}
                          className={cn(
                            'relative flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-150 outline-none',
                            active
                              ? 'text-white'
                              : 'text-[#a2b4c0] hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] focus-visible:text-white'
                          )}
                          style={{ zIndex: 1 }}
                        >
                          <span
                            className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                            style={{
                              background: active ? 'rgba(255,255,255,0.22)' : tone.soft,
                              boxShadow: 'none',
                            }}
                            aria-hidden
                          >
                            <span
                              aria-hidden
                              style={{
                                position: 'absolute',
                                right: -8,
                                top: -10,
                                width: 18,
                                height: 18,
                                borderRadius: 999,
                                backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                              }}
                            />
                            <Icon
                              style={{
                                position: 'relative',
                                width: 14,
                                height: 14,
                                color: active ? '#ffffff' : tone.fg,
                                flexShrink: 0,
                              }}
                            />
                          </span>
                          <span
                            className="truncate"
                            style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </nav>

      {/* Пользователь */}
      <div
        className="flex-shrink-0 px-3 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Аватар */}
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0 text-white font-semibold"
            style={{
              width: 30, height: 30,
              backgroundColor: '#0c4d6c',
              fontSize: 11,
            }}
          >
            {user?.name ? getInitials(user.name) : '??'}
          </div>

          {/* Имя и роль */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate" style={{ fontSize: 12 }}>
              {user?.name ?? 'Загрузка...'}
            </p>
            <p style={{ fontSize: 11, color: '#a2b4c0' }} className="truncate">
              {role ? ROLE_LABELS[role] : ''}
            </p>
          </div>

          {/* Выход */}
          <button
            onClick={() => signOut()}
            className="flex-shrink-0 transition-colors duration-150"
            style={{ color: '#4a6075' }}
            title="Выйти"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#4a6075'
            }}
          >
            <LogOut style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>
    </aside>
  )
}
