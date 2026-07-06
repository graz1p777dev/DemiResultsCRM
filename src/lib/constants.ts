import type {
  ConsultationStatus,
  ActualStatus,
  StatusAfterFv,
  AlbStatus,
  AttendanceStatus,
  UserRole,
  EmployeeStatus,
  SalaryStatus,
} from '@/types'

// ============================================================
// Consultation status labels & colors
// ============================================================

export const CONSULTATION_STATUS_MAP: Record<
  ConsultationStatus,
  { label: string; color: string; bg: string }
> = {
  'Придёт':      { label: 'Придёт',      color: '#16a34a', bg: '#dcfce7' },
  'Не придёт':   { label: 'Не придёт',   color: '#dc2626', bg: '#fee2e2' },
  'Перезапись':  { label: 'Перезапись',  color: '#d97706', bg: '#fef3c7' },
  'Отменил':     { label: 'Отменил',     color: '#6b7280', bg: '#f3f4f6' },
  'Не отвечает': { label: 'Не отвечает', color: '#9333ea', bg: '#f3e8ff' },
}

export const ACTUAL_STATUS_MAP: Record<
  ActualStatus,
  { label: string; color: string; bg: string }
> = {
  'Пришла':    { label: 'Пришла',    color: '#16a34a', bg: '#dcfce7' },
  'Не пришла': { label: 'Не пришла', color: '#dc2626', bg: '#fee2e2' },
}

export const STATUS_AFTER_FV_MAP: Record<
  StatusAfterFv,
  { label: string; color: string; bg: string }
> = {
  'Купила':    { label: 'Купила',    color: '#16a34a', bg: '#dcfce7' },
  'Не купила': { label: 'Не купила', color: '#dc2626', bg: '#fee2e2' },
  'Предоплата':{ label: 'Предоплата',color: '#0c4d6c', bg: '#dbeafe' },
  'Дожать':    { label: 'Дожать',    color: '#d97706', bg: '#fef3c7' },
  'Отказ':     { label: 'Отказ',     color: '#6b7280', bg: '#f3f4f6' },
}

export const ALB_STATUS_MAP: Record<
  AlbStatus,
  { label: string; color: string; bg: string }
> = {
  'Не записан': { label: 'Не записан', color: '#6b7280', bg: '#f3f4f6' },
  'Записан':    { label: 'Записан',    color: '#0c4d6c', bg: '#dbeafe' },
  'Пришёл':     { label: 'Пришёл',    color: '#16a34a', bg: '#dcfce7' },
  'Не пришёл':  { label: 'Не пришёл', color: '#dc2626', bg: '#fee2e2' },
  'Купил':      { label: 'Купил',     color: '#15803d', bg: '#bbf7d0' },
}

export const FORMAT_BADGE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  'Онлайн': { label: 'Онлайн', color: '#1d4ed8', bg: '#dbeafe' },
  'Офлайн': { label: 'Офлайн', color: '#c2410c', bg: '#ffedd5' },
}

// ============================================================
// Attendance status labels & colors
// ============================================================

export const ATTENDANCE_STATUS_MAP: Record<
  AttendanceStatus,
  { label: string; color: string; dot: string }
> = {
  present:  { label: 'На месте',  color: '#16a34a', dot: 'bg-green-500'  },
  remote:   { label: 'Удалённо',  color: '#0c4d6c', dot: 'bg-blue-500'   },
  absent:   { label: 'Отсутствует',color: '#dc2626',dot: 'bg-red-500'    },
  sick:     { label: 'Больничный',color: '#d97706', dot: 'bg-amber-500'  },
  vacation: { label: 'Отпуск',    color: '#9333ea', dot: 'bg-purple-500' },
  day_off:  { label: 'Выходной',  color: '#6b7280', dot: 'bg-gray-400'   },
  weekend:  { label: 'Выходной',  color: '#6b7280', dot: 'bg-gray-400'   },
}

// ============================================================
// Employee role labels
// ============================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  owner:     'Владелец',
  rop:       'РОП',
  mp:        'МП',
  lmai:      'LMAI',
  accountant:'Бухгалтер',
}

export const EMPLOYEE_STATUS_MAP: Record<
  EmployeeStatus,
  { label: string; color: string }
> = {
  active:   { label: 'Активен',    color: '#16a34a' },
  vacation: { label: 'В отпуске',  color: '#d97706' },
  sick:     { label: 'На больничном', color: '#dc2626' },
  archived: { label: 'Архив',      color: '#6b7280' },
}

// ============================================================
// Salary status labels & colors
// ============================================================

export const SALARY_STATUS_MAP: Record<
  SalaryStatus,
  { label: string; color: string; bg: string }
> = {
  draft:    { label: 'Черновик',  color: '#6b7280', bg: '#f3f4f6' },
  approved: { label: 'Утверждён', color: '#d97706', bg: '#fef3c7' },
  paid:     { label: 'Выплачен',  color: '#16a34a', bg: '#dcfce7' },
}

// ============================================================
// KPI progress thresholds (color breakpoints)
// ============================================================

export const KPI_THRESHOLDS = {
  danger:  30,  // < 30% → red
  warning: 60,  // 30–60% → amber
  brand:   90,  // 60–90% → navy
  success: 100, // ≥ 90% → green
} as const

export function getKpiColor(pct: number): string {
  if (pct < KPI_THRESHOLDS.danger)  return '#dc2626' // red
  if (pct < KPI_THRESHOLDS.warning) return '#d97706' // amber
  if (pct < KPI_THRESHOLDS.success) return '#0c4d6c' // brand navy
  return '#16a34a'                                    // green
}

// ============================================================
// Finance transaction types
// ============================================================

export const TRANSACTION_TYPE_LABELS = {
  income:  { label: 'Доход',  color: '#16a34a' },
  expense: { label: 'Расход', color: '#dc2626' },
} as const

// ============================================================
// Brand palette (from Design System)
// ============================================================

export const BRAND = {
  navyDark: '#0c2136',
  navy:     '#0c4d6c',
  steel:    '#a2b4c0',
  fog:      '#ebebee',
  sidebar:  '#0c1f33',
} as const
