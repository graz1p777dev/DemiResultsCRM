import { BarChart3 } from 'lucide-react'
import BotPlaceholder from '@/components/bot/BotPlaceholder'

export default function BotAnalyticsPage() {
  return (
    <BotPlaceholder
      icon={<BarChart3 size={26} color="#fff" />}
      title="Аналитика бота"
      subtitle="Расход токенов по периодам, стоимость в долларах, активность по часам и проблемы клиентов."
      note="Раздел в процессе переноса — шаг 3"
    />
  )
}
