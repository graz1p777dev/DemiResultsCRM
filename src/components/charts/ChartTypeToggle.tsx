'use client'

import { AreaChart, BarChart3, LineChart } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ChartKind = 'bar' | 'line' | 'area'

const OPTIONS: { kind: ChartKind; icon: typeof BarChart3; label: string }[] = [
  { kind: 'bar', icon: BarChart3, label: 'Столбцы' },
  { kind: 'line', icon: LineChart, label: 'Линия' },
  { kind: 'area', icon: AreaChart, label: 'Область' },
]

interface ChartTypeToggleProps {
  value: ChartKind
  onChange: (kind: ChartKind) => void
  className?: string
}

export function ChartTypeToggle({ value, onChange, className }: ChartTypeToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg p-0.5 bg-white/50 backdrop-blur-md border border-white/60 shadow-sm',
        className
      )}
      role="group"
      aria-label="Тип графика"
    >
      {OPTIONS.map(({ kind, icon: Icon, label }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onChange(kind)}
          title={label}
          aria-pressed={value === kind}
          className={cn(
            'flex items-center justify-center rounded-md w-7 h-7 transition-all duration-150',
            value === kind
              ? 'accent-gradient accent-shadow text-white'
              : 'text-slate-500 hover:bg-white/70 accent-text'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  )
}
