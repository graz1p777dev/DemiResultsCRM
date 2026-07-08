import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '@/types'
import { FinanceNavIcon } from '@/components/finance/FinanceDesignerIcons'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles: UserRole[]
  exact?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Megaphone,
  DollarSign,
  Users,
  Calendar,
  Bell,
  FileText,
  Settings,
  MessageSquare,
  FileBarChart2,
  SlidersHorizontal,
  Boxes,
  FlaskConical,
} from 'lucide-react'

// Товароучёт — отдельное Next.js-приложение (Vercel), примонтированное на
// этот же домен по префиксу /inventory через rewrites в next.config.ts
// (Next.js Multi-Zones). Не часть роутера этого приложения — Sidebar.tsx
// рендерит такие ссылки обычным <a>, чтобы был hard navigation, а не
// клиентский переход react-router'ом (иначе 404, т.к. /inventory/* не
// входит в манифест маршрутов этой сборки).
const INVENTORY_URL = '/inventory'

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Главное',
    items: [
      {
        href: '/dashboard',
        label: 'Дашборд',
        icon: LayoutDashboard,
        roles: ['owner', 'rop', 'mp', 'lmai'],
        exact: true,
      },
      {
        href: '/dashboard/consultations',
        label: 'Записи',
        icon: CalendarDays,
        roles: ['owner', 'rop', 'mp', 'lmai'],
      },
    ],
  },
  {
    label: 'AI Бот',
    items: [
      {
        href: '/dashboard/dialogs',
        label: 'Диалоги',
        icon: MessageSquare,
        roles: ['owner', 'rop', 'mp', 'lmai'],
      },
      {
        href: '/dashboard/bot-analytics',
        label: 'Аналитика бота',
        icon: BarChart3,
        roles: ['owner', 'rop'],
      },
      {
        href: '/dashboard/bot-reports',
        label: 'Отчёты бота',
        icon: FileBarChart2,
        roles: ['owner', 'rop'],
      },
      {
        href: '/dashboard/bot-settings',
        label: 'Настройки бота',
        icon: SlidersHorizontal,
        roles: ['owner'],
      },
      {
        href: '/dashboard/laboratory',
        label: 'Лаборатория',
        icon: FlaskConical,
        roles: ['owner'],
      },
    ],
  },
  {
    label: 'Товароучёт',
    items: [
      {
        href: INVENTORY_URL,
        label: 'Товароучёт',
        icon: Boxes,
        roles: ['owner'],
      },
    ],
  },
  {
    label: 'Аналитика',
    items: [
      {
        href: '/dashboard/decomposition',
        label: 'Декомпозиция',
        icon: BarChart3,
        roles: ['owner', 'rop', 'mp', 'lmai'],
      },
      {
        href: '/dashboard/salary',
        label: 'Зарплата',
        icon: DollarSign,
        roles: ['owner', 'rop', 'mp', 'lmai', 'accountant'],
      },
      {
        href: '/dashboard/finance',
        label: 'Финансы',
        icon: FinanceNavIcon,
        roles: ['owner', 'accountant'],
      },
      {
        href: '/dashboard/marketing',
        label: 'Маркетинг',
        icon: Megaphone,
        roles: ['owner', 'rop'],
      },
    ],
  },
  {
    label: 'Управление',
    items: [
      {
        href: '/dashboard/employees',
        label: 'Сотрудники',
        icon: Users,
        roles: ['owner', 'rop'],
      },
      {
        href: '/dashboard/calendar',
        label: 'Календарь',
        icon: Calendar,
        roles: ['owner', 'rop', 'mp', 'lmai'],
      },
      {
        href: '/dashboard/notifications',
        label: 'Уведомления',
        icon: Bell,
        roles: ['owner', 'rop', 'mp', 'lmai', 'accountant'],
      },
      {
        href: '/dashboard/documents',
        label: 'Документы',
        icon: FileText,
        roles: ['owner', 'accountant', 'rop'],
      },
    ],
  },
  {
    label: 'Система',
    items: [
      {
        href: '/dashboard/settings',
        label: 'Настройки',
        icon: Settings,
        roles: ['owner'],
      },
    ],
  },
]
