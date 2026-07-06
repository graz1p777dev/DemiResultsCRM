'use client'

import { useEffect, useRef, useState } from 'react'
import { botGet, botJson } from '@/lib/bot-api'
import { Bot, User, Headset, Power, PowerOff, Send, Search, RefreshCw, ExternalLink } from 'lucide-react'

type Conversation = {
  id: number
  amocrm_lead_id: string
  chat_id: string | null
  contact_id: string | null
  ai_enabled: boolean
  last_message_at: string | null
  client: string | null
  phone: string | null
}

type ChatMessage = { id: number; role: string; text: string; status: string; created_at: string | null }
type ChatData = {
  lead_id: string
  client_name: string | null
  client_phone: string | null
  amocrm_url: string
  messages: ChatMessage[]
}

function fmt(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function DialogsPage() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [chat, setChat] = useState<ChatData | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConvs = () => {
    botGet<Conversation[]>('/admin/conversations')
      .then(setConvs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadConvs() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView() }, [chat])

  const openChat = (c: Conversation) => {
    setSelected(c)
    setChatLoading(true)
    botGet<ChatData>(`/admin/chat/${c.amocrm_lead_id}`)
      .then(setChat)
      .catch(() => setChat(null))
      .finally(() => setChatLoading(false))
  }

  const toggleAi = async (c: Conversation) => {
    try {
      await botJson(`/admin/leads/${c.id}/ai`, 'PATCH', { enabled: !c.ai_enabled })
      setConvs(prev => prev.map(x => x.id === c.id ? { ...x, ai_enabled: !c.ai_enabled } : x))
      if (selected?.id === c.id) setSelected({ ...c, ai_enabled: !c.ai_enabled })
    } catch { /* noop */ }
  }

  const sendManual = async () => {
    if (!selected || !draft.trim() || sending) return
    setSending(true)
    try {
      await botJson(`/admin/leads/${selected.id}/messages`, 'POST', { text: draft.trim() })
      setDraft('')
      openChat(selected)
    } catch {
      alert('Не удалось отправить')
    } finally {
      setSending(false)
    }
  }

  const filtered = convs.filter(c =>
    !query.trim() ||
    (c.client || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.phone || '').includes(query) ||
    c.amocrm_lead_id.includes(query)
  )

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-52px)] flex gap-4">
      {/* Список диалогов */}
      <div className={`flex flex-col rounded-2xl bg-white overflow-hidden w-full md:w-80 md:flex-shrink-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3" style={{ borderBottom: '1px solid #ebebee' }}>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#f5f6f8' }}>
            <Search size={14} color="#8a97a5" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Имя, телефон, lead..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#0c2136' }}
            />
            <button onClick={loadConvs} title="Обновить"><RefreshCw size={13} color="#8a97a5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <p className="p-4 text-sm" style={{ color: '#8a97a5' }}>Загрузка...</p>}
          {!loading && filtered.length === 0 && <p className="p-4 text-sm" style={{ color: '#8a97a5' }}>Диалогов нет</p>}
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => openChat(c)}
              className="w-full text-left px-4 py-3 transition-colors"
              style={{
                borderBottom: '1px solid #f1f2f4',
                backgroundColor: selected?.id === c.id ? '#eef5f9' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate" style={{ color: '#0c2136' }}>
                  {c.client || c.phone || `Lead ${c.amocrm_lead_id}`}
                </span>
                <span
                  className="flex-shrink-0 rounded-full"
                  title={c.ai_enabled ? 'ИИ включён' : 'ИИ выключен'}
                  style={{ width: 8, height: 8, backgroundColor: c.ai_enabled ? '#16a34a' : '#d1d5db' }}
                />
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs truncate" style={{ color: '#8a97a5' }}>
                  {c.phone || `Lead ${c.amocrm_lead_id}`}
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: '#b3bcc5' }}>{fmt(c.last_message_at)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Чат */}
      <div className={`flex-col rounded-2xl bg-white overflow-hidden flex-1 min-w-0 ${selected ? 'flex' : 'hidden md:flex'}`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2" style={{ color: '#b3bcc5' }}>
            <Bot size={36} />
            <p className="text-sm">Выберите диалог слева</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #ebebee' }}>
              <button className="md:hidden text-sm" style={{ color: '#0c4d6c' }} onClick={() => setSelected(null)}>←</button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: '#0c2136' }}>
                  {chat?.client_name || selected.client || 'Без имени'}
                </p>
                <p className="text-xs truncate" style={{ color: '#8a97a5' }}>
                  {chat?.client_phone || selected.phone || ''} · Lead {selected.amocrm_lead_id}
                </p>
              </div>
              <button
                onClick={() => toggleAi(selected)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                style={selected.ai_enabled
                  ? { backgroundColor: '#dcfce7', color: '#15803d' }
                  : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
              >
                {selected.ai_enabled ? <Power size={12} /> : <PowerOff size={12} />}
                {selected.ai_enabled ? 'ИИ вкл' : 'ИИ выкл'}
              </button>
              {chat && (
                <a href={chat.amocrm_url} target="_blank" rel="noopener noreferrer" title="Открыть в amoCRM"
                   className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, color: '#0c4d6c' }}>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ backgroundColor: '#f9fafb' }}>
              {chatLoading && <p className="text-sm text-center" style={{ color: '#8a97a5' }}>Загрузка чата...</p>}
              {!chatLoading && chat?.messages.length === 0 && (
                <p className="text-sm text-center mt-8" style={{ color: '#8a97a5' }}>Сообщений нет</p>
              )}
              {chat?.messages.map(m => {
                const isClient = m.role === 'user'
                const isManager = m.role === 'manager'
                return (
                  <div key={m.id} className={`flex flex-col max-w-[80%] ${isClient ? 'items-start self-start' : 'items-end self-end'}`}>
                    <div className="flex items-center gap-1 text-[10px] mb-0.5" style={{ color: isManager ? '#16a34a' : '#8a97a5' }}>
                      {isClient ? <><User size={9} /> Клиент</> : isManager ? <><Headset size={9} /> Консультант</> : <><Bot size={9} /> ИИ бот</>}
                      <span style={{ color: '#b3bcc5' }}>{fmt(m.created_at)}</span>
                    </div>
                    <div
                      className="px-3.5 py-2 text-sm whitespace-pre-wrap break-words rounded-2xl"
                      style={isClient
                        ? { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#0c2136', borderBottomLeftRadius: 4 }
                        : isManager
                          ? { backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', color: '#14532d', borderBottomRightRadius: 4 }
                          : { backgroundColor: '#0c4d6c', color: '#ffffff', borderBottomRightRadius: 4 }}
                    >
                      {m.text}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 p-3 flex-shrink-0" style={{ borderTop: '1px solid #ebebee' }}>
              <textarea
                rows={2}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendManual() }}
                placeholder="Ответить клиенту вручную... (Ctrl+Enter)"
                className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#f5f6f8', color: '#0c2136' }}
              />
              <button
                onClick={sendManual}
                disabled={sending || !draft.trim()}
                className="self-end flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#0c4d6c' }}
              >
                <Send size={14} /> {sending ? '...' : 'Отправить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
