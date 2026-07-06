<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Demi Results — Единая CRM · Гид для ИИ-агентов

Весь текст в общении и документации — **на русском**. Код, имена файлов, функции, SQL, env — на английском.

## Что это за проект

Объединённая CRM из двух источников:

1. **Бизнес-CRM** (база проекта) — дашборд, записи, декомпозиция, зарплата, финансы, маркетинг, сотрудники, настройки. Работает на **Supabase** (Server Actions + Auth + RLS). Подробности — в [CLAUDE.md](CLAUDE.md).
2. **Модули AI-бота** (добавлены поверх) — диалоги, аналитика бота, отчёты бота, настройки бота. Работают через внешний **FastAPI-бэкенд** (не в этой репе).

## Архитектура — две спины, один фронт

```
┌─────────────────── Next.js фронт (эта репа, Vercel) ───────────────────┐
│                                                                         │
│  Бизнес-модули            │           Модули AI-бота                    │
│  /dashboard/*             │           /dashboard/dialogs                │
│  (кроме bot-*, dialogs)   │           /dashboard/bot-analytics          │
│                           │           /dashboard/bot-reports            │
│                           │           /dashboard/bot-settings           │
│         │                 │                    │                        │
└─────────┼─────────────────┴────────────────────┼───────────────────────┘
          │ Server Actions                        │ fetch → /api/backend/* прокси
          ▼                                        ▼
    ┌───────────┐                          ┌──────────────────┐
    │ Supabase  │                          │ FastAPI бот-бэк   │
    │ (Postgres)│                          │ Celery + Redis    │
    └───────────┘                          │ amoCRM/OpenAI/TG  │
                                           │ (Railway, др.репа)│
                                           └──────────────────┘
```

## Где чья зона ответственности

| Агент работает над… | Файлы | Бэкенд |
|---|---|---|
| **Бизнес-модули** | `src/app/dashboard/{consultations,decomposition,salary,finance,marketing,employees,settings}`, `src/actions/*`, `src/lib/supabase/*` | Supabase (в этой репе через Server Actions) |
| **Модули бота (фронт)** | `src/app/dashboard/{dialogs,bot-analytics,bot-reports,bot-settings}`, `src/lib/bot-api.ts`, `src/components/bot/*` | Внешний FastAPI — **править в его репе**, здесь только вызовы |
| **Прокси к боту** | `src/app/api/backend/[...path]/route.ts` | — |

> **Важно:** логику AI-бота (обработка сообщений, промпты, Telegram, OpenAI) НЕЛЬЗЯ реализовывать в этой репе. Она живёт в отдельном FastAPI-проекте. Здесь — только UI, который дёргает бот-бэкенд через `/api/backend/*`.

## Интеграционный слой бота (что уже сделано)

- `src/config/nav.ts` — добавлена nav-группа **«AI Бот»** с 4 пунктами.
- `src/app/api/backend/[...path]/route.ts` — прокси на FastAPI (env `BOT_BACKEND_API_URL`, `BOT_BACKEND_ADMIN_API_KEY`). Тело передаётся как `arrayBuffer` (не ломает загрузку файлов).
- `src/lib/bot-api.ts` — хелперы `botGet` / `botJson` (базовый путь `/api/backend`).
- `src/components/bot/BotPlaceholder.tsx` + 4 страницы-заглушки — их предстоит заменить реальными переносами.

### Ручки бот-бэкенда (для справки, детали — в его репе)
`/admin/conversations`, `/admin/chat/{leadId}`, `/admin/analytics`, `/admin/analytics/tokens`,
`/admin/reports/daily`, `/admin/blacklist`, `/admin/stop-words`, `/admin/bot-prompt`,
`/admin/bot-model`, `/admin/openai-models`, `/admin/managers`, `/admin/ai-test`,
`/admin/ai-test/transcribe`. Вызывать через `botGet('/admin/...')`.

## Стек

Next.js 16 · React 19 · TypeScript strict (no `any`, no `!`) · Tailwind CSS 4 · shadcn/ui · lucide-react · Recharts · Sonner · Supabase.

## Дизайн-язык (соблюдать в модулях бота)

- Тёмный navy sidebar `#0c1f33`, активный пункт `#0c4d6c`.
- Карточки на страницах — белый фон, заголовок-акцент `#0c2136`, иконка в квадрате `#0c4d6c`.
- Скругления `rounded-2xl` для карточек, `rounded-xl` для иконок.
- Совпадать по виду с существующими страницами (`src/app/dashboard/settings/page.tsx` — эталон).

## Правила

- **Server Components по умолчанию**, `'use client'` только при `useState`/`useEffect`/событиях.
- Бизнес-мутации — **только Server Actions**, Supabase напрямую из клиента не звать.
- `SUPABASE_SERVICE_ROLE_KEY` никогда не в клиентский код.
- Модули бота — клиентские компоненты, данные тянуть через `bot-api.ts`.
- Перед деплоем: `npm run build` должен проходить чисто.

## Деплой

См. [DEPLOY.md](DEPLOY.md). Frontend → Vercel, бизнес-БД → Supabase, бот → Railway (отдельная репа).

## Статус переноса модулей бота

- [x] Шаг 1 — оболочка, навигация, прокси
- [ ] Шаг 2 — Диалоги (список + чат + одобрение)
- [ ] Шаг 3 — Аналитика бота (токены, графики)
- [ ] Шаг 4 — Отчёты бота (сводка, воронка, стоп-слова, ЧС)
- [ ] Шаг 5 — Настройки бота (промпт, модель, тест ИИ с фото/голосом)
