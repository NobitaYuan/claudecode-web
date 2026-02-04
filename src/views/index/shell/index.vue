<script setup lang="ts">
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { Project, Session } from '../types'
import { CCServerBaseUrl } from '@/api/api'

// ============ 类型定义 ============

/** WebSocket 消息类型 */
interface IWebSocketMessage {
  type: 'output' | 'url_open'
  data?: string
  url?: string
}

/** Props 接口定义 */
interface IProps {
  selectedProject?: Project | null
  selectedSession?: Session | null
  initialCommand?: string
  isPlainShell?: boolean
  onProcessComplete?: ((exitCode: number) => void) | null
  minimal?: boolean
  autoConnect?: boolean
}

// ============ Props 定义 ============
const props = withDefaults(defineProps<IProps>(), {
  selectedProject: null,
  selectedSession: null,
  initialCommand: undefined,
  isPlainShell: false,
  onProcessComplete: null,
  minimal: false,
  autoConnect: true,
})

// ============ XTerm 样式注入 ============
const styleInject = () => {
  const xtermStyles = `
        .xterm .xterm-screen {
          outline: none !important;
        }
        .xterm:focus .xterm-screen {
          outline: none !important;
        }
        .xterm-screen:focus {
          outline: none !important;
        }
        .composition-view,.xterm-helper-textarea {
          left: 0 !important;
        }
      `
  // 上面这段是处理，输入中文时的输入框位置偏移错误
  if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style')
    styleSheet.innerText = xtermStyles
    document.head.appendChild(styleSheet)
  }
}
styleInject()

// ============ DOM 和实例引用 ============
const terminalRef = ref<HTMLDivElement | null>(null)
const terminal = shallowRef<Terminal | null>(null)
const fitAddon = shallowRef<FitAddon | null>(null)
const ws = shallowRef<WebSocket | null>(null)

// ============ 连接状态 ============
const isConnected: Ref<boolean> = ref(false)
const isInitialized: Ref<boolean> = ref(false)
const isConnecting: Ref<boolean> = ref(false)

// ============ 计算属性 - 会话名称 ============
const sessionDisplayName: ComputedRef<string | null> = computed(() => {
  if (!props.selectedSession) return null
  return props.selectedSession.__provider === 'cursor' ? props.selectedSession.name || 'Untitled Session' : props.selectedSession.summary || 'New Session'
})

const sessionDisplayNameShort: ComputedRef<string | null> = computed(() => {
  if (!sessionDisplayName.value) return null
  return sessionDisplayName.value.slice(0, 30)
})

const sessionDisplayNameLong: ComputedRef<string | null> = computed(() => {
  if (!sessionDisplayName.value) return null
  return sessionDisplayName.value.slice(0, 50)
})

// ============ WebSocket 连接 ============
const connectWebSocket = async (): Promise<void> => {
  if (isConnecting.value || isConnected.value) return
  isConnecting.value = true
  try {
    let wsUrl: string

    // const token = localStorage.getItem('auth-token')
    // if (!token) {
    //   console.error('No authentication token found for Shell WebSocket connection')
    //   return
    // }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // wsUrl = `${protocol}//${window.location.host}/shell?token=${encodeURIComponent(token)}`
    wsUrl = `${protocol}//${window.location.host}${CCServerBaseUrl}/shell`

    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      isConnected.value = true
      isConnecting.value = false
      isInitialized.value = true
      setTimeout(() => {
        if (fitAddon.value && terminal.value) {
          fitAddon.value.fit()
          initMsg()
        }
      }, 100)
    }

    ws.value.onmessage = (event: MessageEvent) => {
      try {
        const data: IWebSocketMessage = JSON.parse(event.data)

        if (data.type === 'output') {
          const output = data.data || ''

          if (props.isPlainShell && props.onProcessComplete) {
            // eslint-disable-next-line no-control-regex
            const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '')
            if (cleanOutput.includes('Process exited with code 0')) {
              props.onProcessComplete(0)
            } else {
              const match = cleanOutput.match(/Process exited with code (\d+)/)
              if (match) {
                const exitCode = parseInt(match[1])
                if (exitCode !== 0) {
                  props.onProcessComplete(exitCode)
                }
              }
            }
          }

          if (terminal.value) {
            terminal.value.write(output)
          }
        } else if (data.type === 'url_open' && data.url) {
          window.open(data.url, '_blank')
        }
      } catch (error) {
        console.error('[Shell] Error handling WebSocket message:', error, event.data)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ws.value.onclose = (_event: CloseEvent) => {
      isConnected.value = false
      isConnecting.value = false

      if (terminal.value) {
        terminal.value.clear()
        terminal.value.write('\x1b[2J\x1b[H')
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ws.value.onerror = (_error: Event) => {
      isConnected.value = false
      isConnecting.value = false
    }
  } catch (_error) {
    isConnected.value = false
    isConnecting.value = false
  }
}

// 初始化消息
const initMsg = () => {
  if (!ws.value) return

  ws.value?.send(
    JSON.stringify({
      type: 'init',
      projectPath: props.selectedProject?.fullPath || props.selectedProject?.path,
      sessionId: props.isPlainShell ? null : props.selectedSession?.id,
      hasSession: props.isPlainShell ? false : Boolean(props.selectedSession?.id),
      provider: props.isPlainShell ? 'plain-shell' : props.selectedSession?.__provider || 'claude',
      cols: terminal.value.cols,
      rows: terminal.value.rows,
      initialCommand: props.initialCommand,
      isPlainShell: props.isPlainShell,
    }),
  )
}

// 断开连接
const disconnectFromShell = () => {
  if (ws.value) {
    ws.value.close()
    ws.value = null
  }

  if (terminal.value) {
    terminal.value.clear()
    terminal.value.write('\x1b[2J\x1b[H')
  }

  isConnected.value = false
  isConnecting.value = false
}

// 重启
const restartShell = (): void => {
  disconnectFromShell()
  init()
}

// ============ 终端初始化 ============
let cleanupTerminal: (() => void) | null = null
const initializeTerminal = (): (() => void) | null => {
  if (!terminalRef.value || !props.selectedProject || terminal.value) {
    return null
  }

  terminal.value = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    allowProposedApi: true,
    allowTransparency: false,
    convertEol: true,
    scrollback: 10000,
    tabStopWidth: 4,
    windowsMode: false,
    macOptionIsMeta: true,
    macOptionClickForcesSelection: true,
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#ffffff',
      cursorAccent: '#1e1e1e',
      //   selection: '#264f78',
      selectionForeground: '#ffffff',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#ffffff',
      extendedAnsi: [
        '#000000',
        '#800000',
        '#008000',
        '#808000',
        '#000080',
        '#800080',
        '#008080',
        '#c0c0c0',
        '#808080',
        '#ff0000',
        '#00ff00',
        '#ffff00',
        '#0000ff',
        '#ff00ff',
        '#00ffff',
        '#ffffff',
      ],
    },
  })

  fitAddon.value = new FitAddon()
  const webglAddon = new WebglAddon()
  const webLinksAddon = new WebLinksAddon()

  terminal.value.loadAddon(fitAddon.value)
  terminal.value.loadAddon(webLinksAddon)

  try {
    terminal.value.loadAddon(webglAddon)
  } catch (_error) {
    console.warn('[Shell] WebGL renderer unavailable, using Canvas fallback')
  }

  terminal.value.open(terminalRef.value)

  terminal.value.attachCustomKeyEventHandler((event: KeyboardEvent): boolean => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && terminal.value?.hasSelection()) {
      document.execCommand('copy')
      return false
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      navigator.clipboard
        .readText()
        .then((text) => {
          if (ws.value && ws.value.readyState === WebSocket.OPEN) {
            ws.value.send(
              JSON.stringify({
                type: 'input',
                data: text,
              }),
            )
          }
        })
        .catch(() => {})
      return false
    }

    return true
  })

  terminal.value.onData((data: string) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(
        JSON.stringify({
          type: 'input',
          data: data,
        }),
      )
    }
  })

  setTimeout(() => {
    if (fitAddon.value) {
      fitAddon.value.fit()
      if (terminal.value && ws.value && ws.value.readyState === WebSocket.OPEN) {
        ws.value.send(
          JSON.stringify({
            type: 'resize',
            cols: terminal.value.cols,
            rows: terminal.value.rows,
          }),
        )
      }
    }
  }, 100)

  isInitialized.value = true

  const resizeObserver = new ResizeObserver(() => {
    if (fitAddon.value && terminal.value) {
      setTimeout(() => {
        fitAddon.value?.fit()
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
          ws.value.send(
            JSON.stringify({
              type: 'resize',
              cols: terminal.value.cols,
              rows: terminal.value.rows,
            }),
          )
        }
      }, 50)
    }
  })

  if (terminalRef.value) {
    resizeObserver.observe(terminalRef.value)
  }

  return () => {
    resizeObserver.disconnect()
    if (ws.value && (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING)) {
      ws.value.close()
    }
    ws.value = null
    if (terminal.value) {
      terminal.value.dispose()
      terminal.value = null
    }
  }
}

// 初始化
const init = () => {
  if (cleanupTerminal) {
    cleanupTerminal()
  }
  cleanupTerminal = initializeTerminal()
  connectWebSocket()
}

watch(
  () => props.selectedSession,
  () => {
    disconnectFromShell()
    connectWebSocket()
  },
)

onMounted(() => {
  init()
})

onUnmounted(() => {
  disconnectFromShell()
  if (cleanupTerminal) {
    cleanupTerminal()
  }
})
</script>

<template>
  <div class="shell relative h-full">
    <!-- 精简模式 -->
    <div v-if="minimal" class="h-full w-full bg-gray-900">
      <div ref="terminalRef" class="h-full w-full focus:outline-none" style="outline: none" />
    </div>

    <!-- 完整模式 -->
    <div v-else class="h-full flex flex-col bg-gray-900 w-full">
      <!-- Header -->
      <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div :class="['w-2 h-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500']" />
            <span v-if="selectedSession" class="text-xs text-blue-300"> ({{ sessionDisplayNameShort }}...) </span>
            <span v-if="!selectedSession" class="text-xs text-gray-400">新会话</span>
            <span v-if="!isInitialized" class="text-xs text-yellow-400">初始化中...</span>
          </div>
          <div class="flex items-center space-x-3">
            <button
              v-if="isConnected"
              @click="disconnectFromShell"
              class="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1"
              title="断开连接"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>断开</span>
            </button>

            <button
              @click="restartShell"
              class="text-xs text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              title="重启终端"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>重启</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 终端容器 -->
      <div class="flex-1 p-2 overflow-hidden relative">
        <div ref="terminalRef" class="h-full w-full focus:outline-none" style="outline: none" />
      </div>

      <!-- 初始化覆盖层 -->
      <div v-if="!isInitialized" class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
        <div class="text-white">加载中...</div>
      </div>

      <!-- 连接中覆盖层 -->
      <div v-if="isConnecting" class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 p-4 z-[999]">
        <div class="text-center max-w-sm w-full">
          <div class="flex items-center justify-center space-x-3 text-yellow-400">
            <div class="w-6 h-6 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
            <span class="text-base font-medium">连接中...</span>
          </div>
          <p class="text-gray-400 text-sm mt-3 px-2">
            {{ isPlainShell ? `运行命令: ${initialCommand || 'bash'} 在 ${selectedProject.displayName}` : `为 ${selectedProject?.displayName} 启动 CLI` }}
          </p>
        </div>
      </div>
      <!-- 连接按钮覆盖层 -->
      <div
        v-if="isInitialized && !isConnected && !isConnecting"
        class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 p-4 z-[999]"
      >
        <div class="text-center max-w-sm w-full flex flex-col items-center">
          <button
            @click="connectWebSocket"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-base font-medium w-full sm:w-auto"
            title="连接到终端"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>连接</span>
          </button>
          <p class="text-gray-400 text-sm mt-3 px-2">
            {{
              isPlainShell
                ? `运行命令: ${initialCommand || 'bash'} 在 ${selectedProject.displayName}`
                : selectedSession
                  ? `恢复会话: ${sessionDisplayNameLong}`
                  : '启动新的终端会话'
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
