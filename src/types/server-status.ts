export type ServiceStatus = 'online' | 'warning' | 'offline' | 'unknown'

export interface ServiceStatusItem {
  name: string
  status: ServiceStatus
  description: string
}

export interface ProcessRow {
  pid: number
  name: string
  cpu: number
  ram: number
  status: string
}

export interface HistoryPoint {
  time: string
  value: number
}

export interface NetworkHistoryPoint {
  time: string
  in: number
  out: number
}

export interface ServerStatusResponse {
  cpu: {
    percent: number | null
    temperature: number | null
  }
  ram: {
    total: number
    used: number
    percent: number
  }
  disk: {
    total: number | null
    used: number | null
    percent: number | null
  }
  uptimeSeconds: number
  loadAverage: [number, number, number]
  network: {
    inBytesPerSec: number | null
    outBytesPerSec: number | null
  }
  ip: {
    public: string | null
    local: string | null
  }
  services: ServiceStatusItem[]
  processes: ProcessRow[]
  history: {
    cpu: HistoryPoint[]
    ram: HistoryPoint[]
    network: NetworkHistoryPoint[]
  }
  generatedAt: string
}
