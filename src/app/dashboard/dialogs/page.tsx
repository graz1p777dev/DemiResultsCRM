import { MessageSquare } from 'lucide-react'
import BotPlaceholder from '@/components/bot/BotPlaceholder'

export default function DialogsPage() {
  return (
    <BotPlaceholder
      icon={<MessageSquare size={26} color="#fff" />}
      title="Диалоги AI-бота"
      subtitle="Переписка клиентов, одобрение ответов бота и история чата будут перенесены сюда из старой CRM."
      note="Раздел в процессе переноса — шаг 2"
    />
  )
}
