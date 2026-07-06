import { FileBarChart2 } from 'lucide-react'
import BotPlaceholder from '@/components/bot/BotPlaceholder'

export default function BotReportsPage() {
  return (
    <BotPlaceholder
      icon={<FileBarChart2 size={26} color="#fff" />}
      title="Отчёты бота"
      subtitle="Ежедневная сводка, воронка по этапам, активность менеджеров, чёрный список и стоп-слова."
      note="Раздел в процессе переноса — шаг 4"
    />
  )
}
