import { Project } from '../types'

/**
 * WebSocket 消息类型定义
 */
export interface WebSocketMessage {
  type: string
  [key: string]: any
}
/**
 * 加载进度消息
 */
export interface LoadingProgressMessage extends WebSocketMessage {
  type: 'loading_progress'
  phase: string
  current?: number
  total?: number
  currentProject?: string
}
/**
 * 项目更新消息
 */
export interface ProjectsUpdatedMessage extends WebSocketMessage {
  type: 'projects_updated'
  projects: Project[]
  changedFile?: string
}

/**
 * 联合消息类型
 */
export type WsMessage = LoadingProgressMessage | ProjectsUpdatedMessage

/**
 * 加载进度状态
 */
export interface LoadingProgress {
  phase: string
  current?: number
  total?: number
  currentProject?: string
}

// ============================================================
// 状态定义
// ============================================================
const ws = ref<WebSocket | null>(null)
const wsMessages = ref<WsMessage[]>([])
const isConnected = ref<boolean>(false)
let reconnectTimeout: number | null = null
const loadingProgress = ref<LoadingProgress | null>(null)
const loadingProgressTimeout = ref<number | null>(null)
const isLoading = ref(false)

// ============================================================
// 连接函数
const connect = async () => {
  try {
    closeConnect()
    const token = localStorage.getItem('auth-token')

    if (!token) {
      console.warn('No authentication token found for WebSocket connection')
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`

    const websocket = new WebSocket(wsUrl)

    // ========================================================
    // 连接成功事件处理
    websocket.onopen = () => {
      isConnected.value = true
      ws.value = websocket
      console.log('🚀WebSocket 连接成功')
    }

    // ========================================================
    // 消息接收事件处理
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // console.log('onmessage', data)
        wsMessages.value = [...wsMessages.value, data]
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    // ========================================================
    // 连接关闭事件处理
    websocket.onclose = () => {
      isConnected.value = false
      ws.value = null

      // ========================================================
      // 这里是自动重连逻辑
      // 3秒后尝试重连
      reconnectTimeout = window.setTimeout(() => {
        connect()
      }, 3000)
    }

    // ========================================================
    // 连接错误事件处理
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  } catch (error) {
    console.error('Error creating WebSocket connection:', error)
  }
}

// ============================================================
// 发送消息函数
const sendMessage = (message: any) => {
  if (ws.value && isConnected.value) {
    ws.value.send(JSON.stringify(message))
  } else {
    console.warn('WebSocket not connected')
  }
}

// ============================================================
// 关闭
const closeConnect = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
  }
  // 关闭 WebSocket 连接
  if (ws.value) {
    ws.value.close()
  }
}

/**
 * useWebSocket Hook
 *
 * 功能：
 * - 自动连接 WebSocket
 * - 自动重连（3秒后）
 * - 接收并解析 JSON 消息
 * - 发送 JSON 消息
 *
 * @returns WebSocket 管理对象
 */
export function useWebSocket() {
  return {
    ws,
    wsMessages,
    isConnected,
    loadingProgress,
    loadingProgressTimeout,
    isLoading,
    connect,
    closeConnect,
    sendMessage,
  }
}
