'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { getInitials } from '@/lib/formatters'
import { NAV_GROUPS } from '@/config/nav'
import { LogOut } from 'lucide-react'
import type { UserRole } from '@/types'

function isActiveLink(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const role = user?.role as UserRole | undefined

  return (
    <aside
      className="flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden"
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

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-150',
                          active
                            ? 'text-white'
                            : 'text-[#a2b4c0] hover:text-white'
                        )}
                        style={active
                          ? { backgroundColor: '#0c4d6c' }
                          : undefined
                        }
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.06)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''
                          }
                        }}
                      >
                        <Icon
                          style={{
                            width: 16,
                            height: 16,
                            color: active ? '#ffffff' : '#a2b4c0',
                            flexShrink: 0,
                          }}
                        />
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
