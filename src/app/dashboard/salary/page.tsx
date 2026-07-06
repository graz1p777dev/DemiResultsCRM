'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calculator } from 'lucide-react'

interface SalaryRow {
  employee_id: string
  name: string
  role_type: string
  base_salary: number
  fv_fact: number
  sales_fact: number
  revenue_fact: number
  plan_fv: number
  plan_sales: number
  plan_revenue: number
  conversion: number
  pct_plan: number
  bonus: number
  total: number
}

export default function SalaryPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [rows, setRows] = useState<SalaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const isOwner = user?.role === 'owner'
  const monthStr = format(currentMonth, 'yyyy-MM')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: employees } = await supabase.from('employees').select('*').eq('is_active', true)
    const { data: plans } = await supabase.from('month_plans').select('*').eq('month', monthStr).eq('is_general', false)
    const from = monthStr + '-01'
    const to = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), 'yyyy-MM-dd')
    const { data: facts } = await supabase.from('daily_activity').select('*').gte('date', from).lte('date', to)

    const factByEmp: Record<string, any> = {}
    facts?.forEach(f => {
      if (!factByEmp[f.employee_id]) factByEmp[f.employee_id] = { fv_fact: 0, sales_fact: 0, revenue_fact: 0 }
      factByEmp[f.employee_id].fv_fact += f.fv_fact
      factByEmp[f.employee_id].sales_fact += f.sales_fact
      factByEmp[f.employee_id].revenue_fact += f.revenue_fact
    })

    const result: SalaryRow[] = (employees ?? [])
      .filter((e: any) => isOwner || e.user_id === user?.id)
      .map((e: any) => {
        const plan = plans?.find((p: any) => p.employee_id === e.id)
        const fact = factByEmp[e.id] ?? { fv_fact: 0, sales_fact: 0, revenue_fact: 0 }
        const planFv = plan?.plan_fv ?? 0
        const planSales = plan?.plan_sales ?? 0
        const planRevenue = plan?.plan_revenue ?? 0
        const conversion = planFv > 0 ? Math.round((fact.sales_fact / planFv) * 100) : 0
        const pctPlan = planRevenue > 0 ? Math.round((fact.revenue_fact / planRevenue) * 100) : 0
        // Simple bonus logic: 5% of revenue if > 80% plan
        const bonus = pctPlan >= 80 ? Math.round(fact.revenue_fact * 0.05) : 0
        const total = e.salary_base + bonus
        return {
          employee_id: e.id,
          name: e.name,
          role_type: e.role_type,
          base_salary: e.salary_base,
          fv_fact: fact.fv_fact,
          sales_fact: fact.sales_fact,
          revenue_fact: fact.revenue_fact,
          plan_fv: planFv,
          plan_sales: planSales,
          plan_revenue: planRevenue,
          conversion,
          pct_plan: pctPlan,
          bonus,
          total,
        }
      })

    setRows(result)
    setLoading(false)
  }, [currentMonth, user])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Учёт зарплаты</h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-lg font-semibold min-w-48 text-center capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </span>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Загрузка...</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Нет данных</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Сотрудник', 'Роль', 'ФВ факт', 'Продажи', 'Выручка факт', 'Выручка план', '% плана', 'Конверсия', 'Оклад', 'Бонус', 'Итого'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(row => (
                  <tr key={row.employee_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{row.role_type}</span>
                    </td>
                    <td className="px-4 py-3">{row.fv_fact}</td>
                    <td className="px-4 py-3">{row.sales_fact}</td>
                    <td className="px-4 py-3">{row.revenue_fact.toLocaleString('ru')} KGS</td>
                    <td className="px-4 py-3 text-gray-400">{row.plan_revenue.toLocaleString('ru')} KGS</td>
                    <td className={`px-4 py-3 font-bold ${row.pct_plan >= 100 ? 'text-green-600' : row.pct_plan >= 80 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {row.pct_plan}%
                    </td>
                    <td className="px-4 py-3">{row.conversion}%</td>
                    <td className="px-4 py-3">{row.base_salary.toLocaleString('ru')} KGS</td>
                    <td className="px-4 py-3 text-green-600">+{row.bonus.toLocaleString('ru')} KGS</td>
                    <td className="px-4 py-3 font-bold text-lg">{row.total.toLocaleString('ru')} KGS</td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 1 && isOwner && (
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td className="px-4 py-3 font-bold" colSpan={8}>Итого ФОТ</td>
                    <td className="px-4 py-3 font-bold">{rows.reduce((s, r) => s + r.base_salary, 0).toLocaleString('ru')} KGS</td>
                    <td className="px-4 py-3 font-bold text-green-600">+{rows.reduce((s, r) => s + r.bonus, 0).toLocaleString('ru')} KGS</td>
                    <td className="px-4 py-3 font-bold text-lg">{rows.reduce((s, r) => s + r.total, 0).toLocaleString('ru')} KGS</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <strong>Логика расчёта:</strong> Оклад + Бонус 5% от выручки (если выполнено ≥ 80% плана). Настройте KPI в разделе Настройки.
      </div>
    </div>
  )
}
