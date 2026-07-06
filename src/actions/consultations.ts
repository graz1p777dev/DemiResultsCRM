'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const ConsultationSchema = z.object({
  date: z.string().min(1, 'Дата обязательна'),
  time: z.string().min(1, 'Время обязательно'),
  client_name: z.string().min(1, 'Имя клиента обязательно'),
  phone: z.string().nullable().optional(),
  deal_number: z.string().nullable().optional(),
  format: z.enum(['Онлайн', 'Офлайн']).nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  status: z.enum(['Придёт', 'Не придёт', 'Перезапись', 'Отменил', 'Не отвечает']).nullable().optional(),
  alb_status: z.enum(['Не записан', 'Записан', 'Пришёл', 'Не пришёл', 'Купил']).nullable().optional(),
  actual_status: z.enum(['Пришла', 'Не пришла']).nullable().optional(),
  status_after_fv: z.enum(['Купила', 'Не купила', 'Предоплата', 'Дожать', 'Отказ']).nullable().optional(),
  amount: z.number().min(0).default(0),
  delivery_cost: z.number().min(0).default(0),
  is_nv: z.boolean().default(false),
  comment: z.string().nullable().optional(),
  consulting_doctor: z.string().nullable().optional(),
}).refine(
  (data) => data.status_after_fv !== 'Отказ' || (data.comment && data.comment.trim().length > 0),
  { message: 'При статусе «Отказ» комментарий обязателен', path: ['comment'] }
)

export type ConsultationFormData = z.infer<typeof ConsultationSchema>

// ─── Action result type ────────────────────────────────────────────────────────

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

// ─── Проверка авторизации ─────────────────────────────────────────────────────

async function requireSession(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.id ?? null
}

// ─── Гарантия employee_kpi ───────────────────────────────────────────────────
// recalculate_decomposition падает с NOT NULL violation когда для менеджера нет
// строки в employee_kpi за этот период (SELECT INTO returns NULL for all vars).
// Вставляем нулевую запись-placeholder — COALESCE внутри функции даст 0.

async function ensureEmployeeKpi(admin: ReturnType<typeof createAdminClient>, managerId: string, date: string) {
  const d = new Date(date)
  await admin.from('employee_kpi').upsert(
    {
      employee_id:  managerId,
      period_year:  d.getFullYear(),
      period_month: d.getMonth() + 1,
    },
    { onConflict: 'employee_id,period_year,period_month', ignoreDuplicates: true }
  )
}

// ─── createConsultation ────────────────────────────────────────────────────────

export async function createConsultation(data: ConsultationFormData): Promise<ActionResult> {
  const userId = await requireSession()
  if (!userId) return { success: false, error: 'Нет авторизации' }

  const parsed = ConsultationSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' }
  }

  const payload = {
    ...parsed.data,
    format: parsed.data.format ?? null,
    manager_id: parsed.data.manager_id ?? null,
    status: parsed.data.status ?? null,
    actual_status: parsed.data.actual_status ?? null,
    alb_status: parsed.data.alb_status ?? null,
    status_after_fv: parsed.data.status_after_fv ?? null,
    phone: parsed.data.phone ?? null,
    deal_number: parsed.data.deal_number ?? null,
    comment: parsed.data.comment ?? null,
    consulting_doctor: parsed.data.consulting_doctor ?? null,
  }

  const admin = createAdminClient()

  if (payload.manager_id) {
    await ensureEmployeeKpi(admin, payload.manager_id, payload.date)
  }

  const { error } = await admin
    .from('consultations')
    .insert(payload)

  if (error) {
    console.error('[createConsultation] code:', error.code, '| msg:', error.message)
    return { success: false, error: 'Ошибка создания записи' }
  }

  revalidatePath('/dashboard/consultations')
  return { success: true }
}

// ─── updateConsultation ────────────────────────────────────────────────────────

export async function updateConsultation(id: string, data: ConsultationFormData): Promise<ActionResult> {
  const userId = await requireSession()
  if (!userId) return { success: false, error: 'Нет авторизации' }

  const parsed = ConsultationSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' }
  }

  const payload = {
    ...parsed.data,
    format: parsed.data.format ?? null,
    manager_id: parsed.data.manager_id ?? null,
    status: parsed.data.status ?? null,
    actual_status: parsed.data.actual_status ?? null,
    alb_status: parsed.data.alb_status ?? null,
    status_after_fv: parsed.data.status_after_fv ?? null,
    phone: parsed.data.phone ?? null,
    deal_number: parsed.data.deal_number ?? null,
    comment: parsed.data.comment ?? null,
    consulting_doctor: parsed.data.consulting_doctor ?? null,
  }

  const admin = createAdminClient()

  if (payload.manager_id) {
    await ensureEmployeeKpi(admin, payload.manager_id, payload.date)
  }

  const { error } = await admin
    .from('consultations')
    .update(payload)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('[updateConsultation] code:', error.code, '| msg:', error.message)
    return { success: false, error: 'Ошибка обновления записи' }
  }

  revalidatePath('/dashboard/consultations')
  return { success: true }
}

// ─── rebookConsultation ────────────────────────────────────────────────────────
// Текущая запись получает статус "Перезапись" (историческая запись сохраняется).
// Создаётся новая запись с теми же данными клиента, но новой датой и временем.

export async function rebookConsultation(
  id: string,
  newDate: string,
  newTime: string,
  currentData: ConsultationFormData,
): Promise<ActionResult> {
  const userId = await requireSession()
  if (!userId) return { success: false, error: 'Нет авторизации' }

  const parsed = ConsultationSchema.safeParse(currentData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' }
  }

  const admin = createAdminClient()

  // 1. Обновляем текущую запись — присваиваем статус "Перезапись"
  const updatePayload = {
    ...parsed.data,
    format:          parsed.data.format ?? null,
    manager_id:      parsed.data.manager_id ?? null,
    status:          'Перезапись' as const,
    actual_status:   parsed.data.actual_status ?? null,
    alb_status:      parsed.data.alb_status ?? null,
    status_after_fv: parsed.data.status_after_fv ?? null,
    phone:           parsed.data.phone ?? null,
    deal_number:     parsed.data.deal_number ?? null,
    comment:         parsed.data.comment ?? null,
    consulting_doctor: parsed.data.consulting_doctor ?? null,
  }

  const { error: updateError } = await admin
    .from('consultations')
    .update(updatePayload)
    .eq('id', id)
    .is('deleted_at', null)

  if (updateError) {
    console.error('[rebookConsultation] update error:', updateError.message)
    return { success: false, error: 'Ошибка обновления записи' }
  }

  // 2. Создаём новую запись с новой датой/временем, статус сбрасываем в null
  const newPayload = {
    date:              newDate,
    time:              newTime,
    client_name:       parsed.data.client_name,
    phone:             parsed.data.phone ?? null,
    deal_number:       parsed.data.deal_number ?? null,
    format:            parsed.data.format ?? null,
    manager_id:        parsed.data.manager_id ?? null,
    status:            null,
    alb_status:        null,
    actual_status:     null,
    status_after_fv:   null,
    amount:            0,
    delivery_cost:     0,
    is_nv:             false,
    comment:           null,
    consulting_doctor: null,
  }

  if (newPayload.manager_id) {
    await ensureEmployeeKpi(admin, newPayload.manager_id, newDate)
  }

  const { error: insertError } = await admin
    .from('consultations')
    .insert(newPayload)

  if (insertError) {
    console.error('[rebookConsultation] insert error:', insertError.message)
    return { success: false, error: 'Ошибка создания новой записи' }
  }

  revalidatePath('/dashboard/consultations')
  return { success: true }
}

// ─── deleteConsultation (soft delete) ─────────────────────────────────────────

export async function deleteConsultation(id: string): Promise<ActionResult> {
  const userId = await requireSession()
  if (!userId) return { success: false, error: 'Нет авторизации' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('consultations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('[deleteConsultation] code:', error.code, '| msg:', error.message)
    return { success: false, error: 'Ошибка удаления записи' }
  }

  revalidatePath('/dashboard/consultations')
  return { success: true }
}
