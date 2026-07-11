'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, User, KeyRound } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { updateOwnProfile, changeOwnPassword } from '@/actions/auth'
import { validatePassword } from '@/lib/auth-validation'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, updateUser } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next && user) {
      // Синхронизируем поля с актуальным пользователем при каждом открытии
      setName(user.name ?? '')
      setPhone(user.phone ?? '')
      setEmail(user.email ?? '')
      setNewPassword('')
      setConfirmPassword('')
    }
    onOpenChange(next)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    const result = await updateOwnProfile({ name, phone, email })
    setSavingProfile(false)

    if (result.success) {
      updateUser(result.employee)
      toast.success('Профиль обновлён')
    } else {
      toast.error(result.error)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    const pwErr = validatePassword(newPassword)
    if (pwErr) { toast.error(pwErr); return }
    if (newPassword !== confirmPassword) { toast.error('Пароли не совпадают'); return }

    setSavingPassword(true)
    const result = await changeOwnPassword(newPassword)
    setSavingPassword(false)

    if (result.success) {
      toast.success('Пароль изменён')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md glass backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle>Профиль</DialogTitle>
          <DialogDescription>Личные данные и пароль для входа</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <User size={13} /> Данные
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Имя</Label>
            <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Телефон</Label>
              <Input id="profile-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+996 ..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" disabled={savingProfile} className="w-full">
            {savingProfile ? 'Сохраняем...' : 'Сохранить данные'}
          </Button>
        </form>

        <div className="h-px bg-foreground/10 my-1" />

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <KeyRound size={13} /> Смена пароля
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-new-password">Новый пароль</Label>
              <div className="relative">
                <Input
                  id="profile-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Мин. 10 символов"
                  className="pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-confirm-password">Подтверждение</Label>
              <Input
                id="profile-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Мин. 10 символов · одна заглавная буква · одна цифра
          </p>
          <Button
            type="submit"
            variant="outline"
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="w-full"
          >
            {savingPassword ? 'Сохраняем...' : 'Сменить пароль'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
