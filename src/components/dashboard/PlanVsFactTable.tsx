import type { PlanVsFactRow } from '@/types'
import { formatMoney, formatNumber } from '@/lib/formatters'
import { getKpiColor } from '@/lib/constants'

interface PlanVsFactTableProps {
  rows: PlanVsFactRow[]
}

function PlanFactCell({ plan, fact }: { plan: number; fact: number }) {
  return (
    <td
      className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap"
      style={{ fontSize: 12, color: '#374151' }}
    >
      <span style={{ color: '#0c2136', fontWeight: 500 }}>{formatNumber(fact)}</span>
      <span style={{ color: '#a2b4c0', margin: '0 3px' }}>/</span>
      <span style={{ color: '#9ca3af' }}>{formatNumber(plan)}</span>
    </td>
  )
}

function KpiBadge({ pct }: { pct: number }) {
  const color = getKpiColor(pct)
  return (
    <span
      className="inline-flex items-center justify-center rounded-md font-semibold tabular-nums"
      style={{
        fontSize: 11,
        color,
        backgroundColor: color + '18',
        padding: '2px 7px',
        minWidth: 44,
      }}
    >
      {pct.toFixed(1)}%
    </span>
  )
}

export default function PlanVsFactTable({ rows }: PlanVsFactTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          minHeight: 80,
          backgroundColor: '#f9fafb',
          border: '1px dashed #e5e7eb',
        }}
      >
        <p style={{ fontSize: 13, color: '#a2b4c0' }}>Нет данных за этот месяц</p>
      </div>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-xl"
      style={{
        border: '1px solid #f0f2f4',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <table className="w-full min-w-[480px]">
        <thead>
          <tr style={{ borderBottom: '1px solid #f0f2f4' }}>
            {['Сотрудник', 'ФВ факт/план', 'Продажи факт/план', 'Выручка', 'KPI%'].map(col => (
              <th
                key={col}
                className={`px-3 py-2 text-left whitespace-nowrap ${col !== 'Сотрудник' ? 'text-right' : ''}`}
                style={{
                  fontSize: 11,
                  color: '#9ca3af',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.employee_id}
              style={{
                borderBottom: i < rows.length - 1 ? '1px solid #f9fafb' : 'none',
              }}
              className="transition-colors"
              onMouseEnter={e => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ''
              }}
            >
              <td className="px-3 py-2.5" style={{ fontSize: 13, color: '#0c2136', fontWeight: 500 }}>
                {row.employee_name}
              </td>
              <PlanFactCell plan={row.plan_fv} fact={row.fact_fv} />
              <PlanFactCell plan={row.plan_sales} fact={row.fact_sales} />
              <td
                className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap font-medium"
                style={{ fontSize: 12, color: '#0c2136' }}
              >
                {row.revenue > 0 ? formatMoney(row.revenue) : '—'}
              </td>
              <td className="px-3 py-2.5 text-right">
                <KpiBadge pct={row.kpi_pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
