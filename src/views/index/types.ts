export interface Session {
  id: string
  summary: string
  messageCount: number
  lastActivity: string
  cwd: string
  lastUserMessage: string
  lastAssistantMessage: string
}

export interface SessionMeta {
  hasMore: boolean
  total: number
}

export interface Taskmaster {
  hasTaskmaster: boolean
  status: string
}

export interface Project {
  name: string
  path: string
  displayName: string
  fullPath: string
  isCustomName: boolean
  sessions?: Session[]
  sessionMeta?: SessionMeta
  cursorSessions?: any[]
  codexSessions?: any[]
  taskmaster?: Taskmaster
  isFavorite?: boolean
}
