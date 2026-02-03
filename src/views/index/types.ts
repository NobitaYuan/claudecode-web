export interface Session {
  id: string
  summary: string
  messageCount: number
  lastActivity: string
  cwd: string
  lastUserMessage: string
  lastAssistantMessage: string
  __provider?: string
  name: string
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

/** tab切换类型 */
export type TabKeyType = 'chat' | 'shell' | 'files' | 'git' | 'tasks'
