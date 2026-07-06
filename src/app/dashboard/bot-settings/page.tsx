'use client'

import { useEffect, useState } from 'react'
import { botGet, botJson } from '@/lib/bot-api'
import { Bot, Cpu, Brain, MessageCircle, Trash2 } from 'lucide-react'

type TgManager = { name: string; chat_id: string }

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white">
      <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid #ebebee' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl" style={{ backgroundColor: '#0c4d6c' }}>
          {icon}
        </div>
        <h2 className="font-semibold text-sm" style={{ color: '#0c2136' }}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

const btnPrimary = 'rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const areaCls = 'w-full rounded-xl px-3 py-2.5 text-xs outline-none resize-y font-mono leading-relaxed'
const areaStyle = { backgroundColor: '#f5f6f8', color: '#0c2136' } as const

export default function BotSettingsPage() {
  // Промпт
  const [prompt, setPrompt] = useState('')
  const [promptSaved, setPromptSaved] = useState(false)
  // Память магазина
  const [memory, setMemory] = useState('')
  const [memorySaved, setMemorySaved] = useState(false)
  // Модель
  const [models, setModels] = useState<string[]>([])
  const [modelSimple, setModelSimple] = useState('')
  const [modelSales, setModelSales] = useState('')
  const [modelSaved, setModelSaved] = useState(false)
  // Менеджеры
  const [managers, setManagers] = useState<TgManager[]>([])
  const [mgrName, setMgrName] = useState('')
  const [mgrChatId, setMgrChatId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')

  useEffect(() => {
    Promise.allSettled([
      botGet<{ prompt: string }>('/admin/bot-prompt'),
      botGet<{ memory: string }>('/admin/bot-memory'),
      botGet<string[]>('/admin/openai-models'),
      botGet<{ model_simple: string; model_sales: string }>('/admin/bot-model'),
      botGet<TgManager[]>('/admin/managers'),
    ]).then(([p, mem, mods, mod, mgr]) => {
      if (p.status === 'fulfilled') setPrompt(p.value.prompt)
      if (mem.status === 'fulfilled') setMemory(mem.value.memory)
      if (mods.status === 'fulfilled') setModels(mods.value)
      if (mod.status === 'fulfilled') { setModelSimple(mod.value.model_simple); setModelSales(mod.value.model_sales) }
      if (mgr.status === 'fulfilled') setManagers(mgr.value)
      setLoading(false)
    })
  }, [])

  const savePrompt = async () => {
    setSaving('prompt')
    try { await botJson('/admin/bot-prompt', 'PATCH', { prompt }); setPromptSaved(true); setTimeout(() => setPromptSaved(false), 2000) }
    finally { setSaving('') }
  }
  const saveMemory = async () => {
    setSaving('memory')
    try { await botJson('/admin/bot-memory', 'PATCH', { memory }); setMemorySaved(true); setTimeout(() => setMemorySaved(false), 2000) }
    finally { setSaving('') }
  }
  const saveModel = async () => {
    setSaving('model')
    try { await botJson('/admin/bot-model', 'PATCH', { model_simple: modelSimple, model_sales: modelSales }); setModelSaved(true); setTimeout(() => setModelSaved(false), 2000) }
    finally { setSaving('') }
  }
  const addManager = async () => {
    if (!mgrName.trim() || !mgrChatId.trim()) return
    try {
      const res = await botJson<{ managers: TgManager[] }>('/admin/managers', 'POST', { name: mgrName.trim(), chat_id: mgrChatId.trim() })
      setManagers(res.managers); setMgrName(''); setMgrChatId('')
    } catch { alert('Не удалось добавить (возможно, chat_id уже есть)') }
  }
  const removeManager = async (m: TgManager) => {
    if (!confirm(`Удалить менеджера ${m.name}?`)) return
    const res = await botJson<{ managers: TgManager[] }>(`/admin/managers/${encodeURIComponent(m.chat_id)}`, 'DELETE')
    setManagers(res.managers)
  }

  if (loading) return <p className="p-8 text-sm" style={{ color: '#8a97a5' }}>Загрузка настроек...</p>

  const selectCls = 'w-full rounded-xl px-3 py-2 text-sm outline-none'

  return (
    <div className="p-4 md:p-8 flex flex-col gap-5 max-w-4xl">
      <SectionCard icon={<Bot size={15} color="#fff" />} title="Промпт бота">
        <p className="text-xs mb-3" style={{ color: '#8a97a5' }}>
          Системный промпт, которым руководствуется Айым при ответах клиентам. Применяется сразу после сохранения.
        </p>
        <textarea rows={16} value={prompt} onChange={e => setPrompt(e.target.value)} className={areaCls} style={areaStyle} />
        <div className="mt-3">
          <button onClick={savePrompt} disabled={saving === 'prompt'} className={btnPrimary} style={{ backgroundColor: '#0c4d6c' }}>
            {saving === 'prompt' ? 'Сохранение...' : promptSaved ? '✓ Сохранено' : 'Сохранить промпт'}
          </button>
        </div>
      </SectionCard>

      <SectionCard icon={<Cpu size={15} color="#fff" />} title="Модель бота">
        <p className="text-xs mb-3" style={{ color: '#8a97a5' }}>
          «Простые вопросы» — обычные сообщения, «Продажи» — возражения и сложные диалоги.
        </p>
        <div className="grid gap-3 sm:grid-cols-2" style={{ maxWidth: 480 }}>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: '#8a97a5' }}>Простые вопросы</label>
            <select value={modelSimple} onChange={e => setModelSimple(e.target.value)} className={selectCls} style={areaStyle}>
              {modelSimple && !models.includes(modelSimple) && <option value={modelSimple}>{modelSimple}</option>}
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: '#8a97a5' }}>Продажи / возражения</label>
            <select value={modelSales} onChange={e => setModelSales(e.target.value)} className={selectCls} style={areaStyle}>
              {modelSales && !models.includes(modelSales) && <option value={modelSales}>{modelSales}</option>}
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button onClick={saveModel} disabled={saving === 'model'} className={btnPrimary} style={{ backgroundColor: '#0c4d6c' }}>
            {saving === 'model' ? 'Сохранение...' : modelSaved ? '✓ Сохранено' : 'Сохранить модель'}
          </button>
        </div>
      </SectionCard>

      <SectionCard icon={<Brain size={15} color="#fff" />} title="Память магазина">
        <p className="text-xs mb-3" style={{ color: '#8a97a5' }}>
          Знания о магазине: цены, акции, товары. Добавляются к промпту при каждом ответе.
        </p>
        <textarea rows={8} value={memory} onChange={e => setMemory(e.target.value)} className={areaCls} style={areaStyle} />
        <div className="mt-3">
          <button onClick={saveMemory} disabled={saving === 'memory'} className={btnPrimary} style={{ backgroundColor: '#0c4d6c' }}>
            {saving === 'memory' ? 'Сохранение...' : memorySaved ? '✓ Сохранено' : 'Сохранить память'}
          </button>
        </div>
      </SectionCard>

      <SectionCard icon={<MessageCircle size={15} color="#fff" />} title="Менеджеры Telegram">
        <p className="text-xs mb-3" style={{ color: '#8a97a5' }}>
          Менеджеры получают Telegram-карточки с запросами на одобрение. Chat ID можно узнать у @userinfobot.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <input value={mgrName} onChange={e => setMgrName(e.target.value)} placeholder="Имя менеджера"
                 className="rounded-xl px-3 py-2 text-sm outline-none" style={{ ...areaStyle, flex: 1, minWidth: 150 }} />
          <input value={mgrChatId} onChange={e => setMgrChatId(e.target.value)} placeholder="Telegram Chat ID"
                 className="rounded-xl px-3 py-2 text-sm outline-none" style={{ ...areaStyle, flex: 1, minWidth: 150 }} />
          <button onClick={addManager} className={btnPrimary} style={{ backgroundColor: '#0c4d6c' }}>Добавить</button>
        </div>
        {managers.length === 0 ? (
          <p className="text-sm" style={{ color: '#8a97a5' }}>Дополнительных менеджеров нет</p>
        ) : (
          <div className="flex flex-col gap-2">
            {managers.map(m => (
              <div key={m.chat_id} className="flex items-center justify-between rounded-xl px-4 py-2.5"
                   style={{ backgroundColor: '#f5f6f8' }}>
                <div>
                  <span className="text-sm font-medium" style={{ color: '#0c2136' }}>{m.name}</span>
                  <span className="text-xs ml-2 font-mono" style={{ color: '#8a97a5' }}>{m.chat_id}</span>
                </div>
                <button onClick={() => removeManager(m)} title="Удалить"><Trash2 size={14} color="#dc2626" /></button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
