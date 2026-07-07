'use client'

export interface RecentActivity {
  id: string
  title: string
  description: string
  section: string
  createdAt: string
}

const STORAGE_KEY = 'demiresults_recent_activity'
const MAX_ITEMS = 12

function readStoredActivities(): RecentActivity[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is RecentActivity => {
      if (!item || typeof item !== 'object') return false
      const value = item as Record<string, unknown>
      return (
        typeof value.id === 'string' &&
        typeof value.title === 'string' &&
        typeof value.description === 'string' &&
        typeof value.section === 'string' &&
        typeof value.createdAt === 'string'
      )
    })
  } catch {
    return []
  }
}

function writeStoredActivities(items: RecentActivity[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  window.dispatchEvent(new Event('recent-activity-updated'))
}

export function getRecentActivities(): RecentActivity[] {
  return readStoredActivities()
}

export function addRecentActivity(input: Omit<RecentActivity, 'id' | 'createdAt'>) {
  const item: RecentActivity = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  writeStoredActivities([item, ...readStoredActivities()])
}
