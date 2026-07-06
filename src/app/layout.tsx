import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { getImpersonationState } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { Toaster } from 'sonner'
import { Employee } from '@/types'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Demi Results CRM',
  description: 'Система управления бизнесом',
}

// Root layout — читает сессию и employee один раз на SSR.
// Передаёт данные в AuthProvider как начальное состояние:
// клиент стартует с уже известным пользователем, без race condition onAuthStateChange.
const BYPASS_EMPLOYEE = {
  id: 'temp-owner',
  user_id: null,
  department_id: null,
  name: 'Владелец',
  phone: null,
  email: 'temp@local',
  role: 'owner',
  avatar_url: null,
  hire_date: null,
  birth_date: null,
  base_salary: 0,
  kpi_coefficient: 1,
} as unknown as Employee

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (process.env.AUTH_BYPASS === '1') {
    return (
      <html lang="ru" className="h-full">
        <body className={`${inter.className} min-h-full bg-gray-50`}>
          <AuthProvider
            initialEmployee={BYPASS_EMPLOYEE}
            initialRealUser={BYPASS_EMPLOYEE}
            initialImpersonation={null}
          >
            {children}
          </AuthProvider>
          <Toaster position="bottom-right" />
        </body>
      </html>
    )
  }

  const supabase = await createClient()

  // Параллельно получаем сессию и состояние impersonation.
  const [{ data: { session } }, initialImpersonation] = await Promise.all([
    supabase.auth.getSession(),
    getImpersonationState(),
  ])

  let initialEmployee: Employee | null = null
  let initialRealUser: Employee | null = null

  if (session?.user) {
    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .single()

    if (emp) {
      const employee = emp as Employee

      if (employee.role === 'owner' && initialImpersonation) {
        // Режим impersonation: realUser = owner, user = цель impersonation.
        const { data: targetEmp } = await supabase
          .from('employees')
          .select('*')
          .eq('id', initialImpersonation.id)
          .is('deleted_at', null)
          .single()

        initialRealUser = employee
        initialEmployee = (targetEmp as Employee | null) ?? employee
      } else {
        initialEmployee = employee
      }
    }
  }

  return (
    <html lang="ru" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-50`}>
        <AuthProvider
          initialEmployee={initialEmployee}
          initialRealUser={initialRealUser}
          initialImpersonation={initialImpersonation}
        >
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e5e7eb',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
