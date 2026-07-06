'use client'

import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, AreaChart, Area,
  Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, PieChart, Pie,
} from 'recharts'
import type { FinanceDailyRow, FinanceKpi } from '@/lib/models/finance'
import { fmtK } from './finance-plans'

const CARD   = { backgroundColor: '#fff', borderColor: '#ebebee' }
const TIP    = { fontSize: 11, borderRadius: 8, border: '1px solid #ebebee' }
const TICK   = { fontSize: 10, fill: '#a2b4c0' }
const MARGIN = { top: 4, right: 4, left: -16, bottom: 0 }
const H      = 180

const EXP_COLORS = ['#0c2136', '#0c4d6c', '#a2b4c0', '#d1d8dd', '#ebebee']

interface Props { daily: FinanceDailyRow[]; kpi: FinanceKpi }

export default function FinanceCharts({ daily, kpi }: Props) {
  const active = daily.filter(r => !r.isFuture && r.revenue > 0)

  // 1. Выручка vs Расходы
  const revenueExpData = active.map(r => ({
    day: String(r.day), Выручка: r.revenue, Расходы: r.expenses,
  }))

  // 2. Прибыль по дням
  const profitData = active.map(r => ({
    day: String(r.day), Прибыль: r.netProfit,
  }))

  // 3. Структура расходов (stacked bar — топ 10 дней для читаемости)
  const stackedData = active.map(r => ({
    day:       String(r.day),
    ФОТ:       r.expPayroll,
    Маркетинг: r.expMarketing,
    Аренда:    r.expRent,
    Расходники:r.expSupplies,
    Прочие:    r.expOther,
  }))

  // 4. Cash Flow накопительно
  const cashData = active.map(r => ({
    day: String(r.day),
    'Cash In':  r.cashIn,
    'Cash Out': r.cashOut,
    Баланс:     r.cashBalance,
  }))

  // 5. Маржа по дням
  const marginData = active.map(r => ({
    day: String(r.day), Маржа: r.margin,
  }))

  // Pie для структуры расходов (итого)
  const pieData = [
    { name: 'ФОТ',        value: kpi.expBreakdown.payroll,   fill: '#0c2136' },
    { name: 'Аренда',     value: kpi.expBreakdown.rent,      fill: '#0c4d6c' },
    { name: 'Расходники', value: kpi.expBreakdown.supplies,  fill: '#a2b4c0' },
    { name: 'Маркетинг',  value: kpi.expBreakdown.marketing, fill: '#d1d8dd' },
    { name: 'Прочие',     value: kpi.expBreakdown.other,     fill: '#ebebee' },
  ]

  return (
    <div className="space-y-3">

      {/* Строка 1: Выручка vs Расходы | Прибыль */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 shadow-sm border" style={CARD}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#0c2136' }}>Выручка vs Расходы</p>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={revenueExpData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={TICK} interval={4} />
              <YAxis yAxisId="l" tick={TICK} tickFormatter={fmtK} />
              <YAxis yAxisId="r" orientation="right" tick={TICK} tickFormatter={fmtK} />
              <Tooltip contentStyle={TIP} formatter={(v, n) => [fmtK(Number(v)) + ' KGS', String(n)]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar  yAxisId="l" dataKey="Выручка" fill="#0c4d6c" radius={[3,3,0,0]} />
              <Line yAxisId="r" dataKey="Расходы" stroke="#ef4444" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4 shadow-sm border" style={CARD}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#0c2136' }}>Прибыль по дням</p>
          <ResponsiveContainer width="100%" height={H}>
            <BarChart data={profitData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={TICK} interval={4} />
              <YAxis tick={TICK} tickFormatter={fmtK} />
              <Tooltip contentStyle={TIP} formatter={(v, n) => [fmtK(Number(v)) + ' KGS', String(n)]} />
              <Bar dataKey="Прибыль" radius={[3,3,0,0]}>
                {profitData.map((entry, i) => (
                  <Cell key={i} fill={entry.Прибыль >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Строка 2: Структура расходов stacked | Cash Flow | Маржа */}
      <div className="grid grid-cols-3 gap-3">

        <div className="rounded-2xl p-4 shadow-sm border" style={CARD}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#0c2136' }}>Структура расходов</p>
          <ResponsiveContainer width="100%" height={H}>
            <BarChart data={stackedData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={TICK} interval={4} />
              <YAxis tick={TICK} tickFormatter={fmtK} />
              <Tooltip contentStyle={TIP} formatter={(v, n) => [fmtK(Number(v)) + ' KGS', String(n)]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              {['ФОТ','Аренда','Расходники','Маркетинг','Прочие'].map((k, i) => (
                <Bar key={k} dataKey={k} stackId="a" fill={EXP_COLORS[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4 shadow-sm border" style={CARD}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#0c2136' }}>Cash Flow накопительно</p>
          <ResponsiveContainer width="100%" height={H}>
            <AreaChart data={cashData} margin={MARGIN}>
              <defs>
                <linearGradient id="gBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0c4d6c" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0c4d6c" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={TICK} interval={4} />
              <YAxis tick={TICK} tickFormatter={fmtK} />
              <Tooltip contentStyle={TIP} formatter={(v, n) => [fmtK(Number(v)) + ' KGS', String(n)]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area dataKey="Баланс" stroke="#0c4d6c" fill="url(#gBalance)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4 shadow-sm border" style={CARD}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#0c2136' }}>Маржинальность по дням</p>
          <ResponsiveContainer width="100%" height={H}>
            <ComposedChart data={marginData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={TICK} interval={4} />
              <YAxis tick={TICK} tickFormatter={v => v + '%'} domain={[-20, 80]} />
              <Tooltip contentStyle={TIP} formatter={(v, n) => [Number(v).toFixed(1) + '%', String(n)]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <CartesianGrid y={38.8} stroke="#10b981" strokeDasharray="4 4" />
              <Line dataKey="Маржа" stroke="#0c4d6c" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Строка 3: Pie структура расходов итого */}
      <div className="rounded-2xl p-4 shadow-sm border" style={CARD}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#0c2136' }}>Доля расходов за месяц</p>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={180} height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={TIP} formatter={(v, n) => [fmtK(Number(v)) + ' KGS', String(n)]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {pieData.map(entry => {
              const total = pieData.reduce((s, e) => s + e.value, 0)
              const pct   = total === 0 ? 0 : Math.round((entry.value / total) * 100)
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span className="text-[11px] font-medium" style={{ color: '#0c2136' }}>{entry.name}</span>
                  <span className="text-[11px]" style={{ color: '#a2b4c0' }}>{fmtK(entry.value)} KGS</span>
                  <span className="text-[10px] font-bold" style={{ color: '#0c4d6c' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
