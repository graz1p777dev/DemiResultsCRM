import { SlidersHorizontal } from 'lucide-react'
import BotPlaceholder from '@/components/bot/BotPlaceholder'

export default function BotSettingsPage() {
  return (
    <BotPlaceholder
      icon={<SlidersHorizontal size={26} color="#fff" />}
      title="Настройки бота"
      subtitle="Промпт, модель, память магазина, шаблоны ответов, стоп-слова, менеджеры Telegram и тест ИИ бота."
      note="Раздел в процессе переноса — шаг 5"
    />
  )
}
