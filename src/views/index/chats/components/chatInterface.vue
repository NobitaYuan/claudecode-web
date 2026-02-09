<script setup lang="ts">
import { DiffLine, Message, PermissionSuggestion, Provider, toolNameReflect, ToolUseMessage } from '../../hooks/utils/message'
import { Project } from '../../types'
import ClaudeLogo from './ClaudeLogo.vue'
import { MessageResponse } from '@/components/ai-elements/message'
import toolResult from './toolResult.vue'
import todoList from './todoList.vue'
import editLinesDiff from './editLinesDiff.vue'
import writLinesDiff from './writLinesDiff.vue'

// ========================================================
// Props 定义
// ========================================================
interface IProps {
  /** 消息对象 */
  message: Message
  /** 消息索引 */
  index: number
  /** 前一条消息 */
  prevMessage?: Message | null
  /** 创建 diff 的函数 */
  createDiff?: (oldString: string, newString: string) => DiffLine[]
  /** 打开文件的回调 */
  onFileOpen?: (filePath: string, diffData?: { old_string: string; new_string: string }) => void
  /** 显示设置的回调 */
  onShowSettings?: () => void
  /** 授予工具权限的回调 */
  onGrantToolPermission?: (suggestion: PermissionSuggestion) => { success: boolean } | null
  /** 自动展开工具 */
  autoExpandTools?: boolean
  /** 显示原始参数 */
  showRawParameters?: boolean
  /** 显示思考过程 */
  showThinking?: boolean
  /** 选中的项目 */
  selectedProject?: Project | null
  /** AI 提供商 */
  provider?: Provider
}

// 配置默认值，与原 defineProps 的 default 完全一致
const props = withDefaults(defineProps<IProps>(), {
  prevMessage: null,
  onFileOpen: null,
  onShowSettings: null,
  onGrantToolPermission: null,
  autoExpandTools: false,
  showRawParameters: true,
  showThinking: true,
  selectedProject: null,
  provider: 'claude',
})
// ========================================================
// Refs
// ========================================================
const selectedProvider = ref(props.provider || localStorage.getItem('selected-provider') || 'claude')

// ========================================================
// 计算属性
// ========================================================

// 判断消息是否分组
const isGrouped = computed(() => {
  return props.prevMessage && props.prevMessage.type === props.message.type && ['assistant', 'user', 'tool', 'error'].includes(props.message.type)
})

// const permissionGrantState = ref('idle')
// // 权限建议 (从原代码的 getClaudePermissionSuggestion 获取)
// const permissionSuggestion = computed(() => {
//   // TODO: 实现权限建议逻辑
//   return null
// })

// 判断是否应该显示工具结果
const shouldShowToolResult = computed(() => {
  const msg = props.message as ToolUseMessage
  if (!msg.toolResult) return false
  // 隐藏 Edit/Write/Bash 的成功结果
  const shouldHide =
    !msg.toolResult.isError && (msg.toolName === 'Edit' || msg.toolName === 'Write' || msg.toolName === 'ApplyPatch' || msg.toolName === 'Bash')
  return !shouldHide
})

// 解析工具输入 (搜索工具)
const parsedToolInput = computed(() => {
  const msg = props.message as ToolUseMessage
  if (!msg.toolInput) return {}
  try {
    return JSON.parse(msg.toolInput)
  } catch (e) {
    return {}
  }
})

// 解析 Edit 工具输入
const parsedEditInput = computed(() => {
  const msg = props.message as ToolUseMessage
  if (msg.toolName !== 'Edit' || !msg.toolInput) return null
  try {
    const input = JSON.parse(msg.toolInput)
    if (input.file_path && input.old_string && input.new_string) {
      return input
    }
  } catch (e) {
    // 解析失败
  }
  return null
})

// 解析 Write 工具输入
const parsedWriteInput = computed(() => {
  if (props.message.toolName !== 'Write' || !props.message.toolInput) return null
  try {
    const input = JSON.parse(props.message.toolInput)
    if (input.file_path && input.content !== undefined) {
      return input
    }
  } catch (e) {
    // 解析失败
  }
  return null
})

// 解析 TodoWrite 工具输入
const parsedTodoWriteInput = computed(() => {
  if (props.message.toolName !== 'TodoWrite' || !props.message.toolInput) return null
  try {
    const input = JSON.parse(props.message.toolInput)
    if (input.todos && Array.isArray(input.todos)) {
      return input
    }
  } catch (e) {
    // 解析失败
  }
  return null
})

// 解析 Bash 工具输入
const parsedBashInput = computed(() => {
  if (props.message.toolName !== 'Bash' || !props.message.toolInput) return null
  try {
    return JSON.parse(props.message.toolInput)
  } catch (e) {
    return null
  }
})

// 解析 ExitPlanMode 工具输入
const parsedExitPlanInput = computed(() => {
  if (props.message.toolName !== 'ExitPlanMode' || !props.message.toolInput) return null
  try {
    const parsed = JSON.parse(props.message.toolInput)
    if (parsed.plan) {
      // 替换转义的换行符为真正的换行符
      parsed.plan = parsed.plan.replace(/\\n/g, '\n')
      return parsed
    }
  } catch (e) {
    // 解析失败
  }
  return null
})

// 解析 Read 工具输入
const parsedReadInput = computed(() => {
  if (props.message.toolName !== 'Read' || !props.message.toolInput) return null
  try {
    const input = JSON.parse(props.message.toolInput)
    if (input.file_path) {
      return input
    }
  } catch (e) {
    // 解析失败
  }
  return null
})

// 解析 Skill 工具输入
const parsedSkillInput = computed(() => {
  if (props.message.toolName !== 'Skill' || !props.message.toolInput) return null
  try {
    const parsed = JSON.parse(props.message.toolInput)
    if (!parsed) {
      return null
    }
    return parsed
  } catch (e) {
    return null
  }
})

// 格式化内容
const formattedContent = computed(() => {
  const text = String(props.message.content || '')
  try {
    if (typeof text !== 'string') return text
    return text.replace(/Claude AI usage limit reached\|(\d{10,13})/g, (match, ts) => {
      let timestampMs = parseInt(ts, 10)
      if (!Number.isFinite(timestampMs)) return match
      if (timestampMs < 1e12) timestampMs *= 1000 // seconds → ms
      const reset = new Date(timestampMs)

      // Time HH:mm in local time
      const timeStr = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(reset)

      // Human-readable timezone: GMT±HH[:MM] (City)
      const offsetMinutesLocal = -reset.getTimezoneOffset()
      const sign = offsetMinutesLocal >= 0 ? '+' : '-'
      const abs = Math.abs(offsetMinutesLocal)
      const offH = Math.floor(abs / 60)
      const offM = abs % 60
      const gmt = `GMT${sign}${offH}${offM ? ':' + String(offM).padStart(2, '0') : ''}`
      const tzId = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      const cityRaw = tzId.split('/').pop() || ''
      const city = cityRaw
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
      const tzHuman = city ? `${gmt} (${city})` : gmt

      // Readable date like "8 Jun 2025"
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const dateReadable = `${reset.getDate()} ${months[reset.getMonth()]} ${reset.getFullYear()}`

      return `Claude usage limit reached. Your limit will reset at **${timeStr} ${tzHuman}** - ${dateReadable}`
    })
  } catch {
    return text
  }
})

// 判断是否是 JSON 内容
const isJsonContent = computed(() => {
  const trimmedContent = formattedContent.value.trim()
  const startsWithBracket = trimmedContent.startsWith('{') || trimmedContent.startsWith('[')
  const endsWithBracket = trimmedContent.endsWith('}') || trimmedContent.endsWith(']')
  return startsWithBracket && endsWithBracket
})

// 格式化 JSON 内容
const formattedJsonContent = computed(() => {
  if (!isJsonContent.value) return ''
  try {
    const parsed = JSON.parse(formattedContent.value.trim())
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return formattedContent.value
  }
})

// ========================================================
// Methods
// ========================================================

// 格式化时间
function formatTime(timestamp: string | number | Date) {
  return new Date(timestamp).toLocaleTimeString()
}

// 判断是否是搜索工具
function isSearchTool(toolName: string) {
  return ['Grep', 'Glob'].includes(toolName)
}

// 获取消息类型标签
function getMessageTypeLabel() {
  const provider = selectedProvider.value || 'claude'
  if (props.message.type === 'error') return 'Error'
  if (props.message.type === 'tool') return 'Tool'
  if (provider === 'cursor') return 'Cursor'
  if (provider === 'codex') return 'Codex'
  return 'Claude'
}

// 处理 Edit 文件打开
async function handleEditFileOpen(filePath: string) {
  if (!props.onFileOpen) return
  props.onFileOpen(filePath)
}

// 处理 Write 文件打开
async function handleWriteFileOpen(filePath: string) {
  if (!props.onFileOpen) return
  props.onFileOpen(filePath, {
    old_string: '',
    new_string: parsedWriteInput.value?.content || '',
  })
}

const openImg = (img: string) => {
  window.open(img, '_blank')
}
</script>

<template>
  <div :class="['chat-message', message.type, isGrouped ? 'grouped' : '', message.type === 'user' ? 'flex justify-end px-3 sm:px-0' : 'px-3 sm:px-0']">
    <!-- ========================================================
         分支1: 这里是用户消息渲染分支 (右侧蓝色气泡)
         ======================================================== -->
    <div v-if="message.type === 'user'" class="flex justify-end items-end space-x-0 sm:space-x-3">
      <!-- 用户消息气泡 -->
      <div class="bg-blue-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 shadow-sm">
        <!-- 消息文本内容 -->
        <div class="text-sm whitespace-pre-wrap break-words">
          {{ message.content }}
        </div>

        <!-- 这里是图片附件渲染分支 -->
        <div v-if="message.images && message.images.length > 0" class="mt-2 grid grid-cols-2 gap-2">
          <img
            v-for="(img, idx) in message.images"
            :key="idx"
            :src="img.data"
            :alt="img.name"
            class="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            @click="openImg(img.data)"
          />
        </div>

        <!-- 时间戳 -->
        <div class="text-xs text-blue-100 mt-2 text-right">
          {{ formatTime(message.timestamp) }}
        </div>
      </div>

      <!-- 用户头像 (仅非分组消息显示) -->
      <div v-if="!isGrouped" class="hidden sm:flex w-8 h-8 bg-blue-600 rounded-full items-center justify-center text-white text-sm flex-shrink-0">U</div>
    </div>

    <!-- ========================================================
         分支2: 这里是 AI/工具/错误消息渲染分支 (左侧)
         ======================================================== -->
    <div v-else class="w-full">
      <!-- 这里是消息头部渲染分支 (头像 + 标签) -->
      <div v-if="!isGrouped" class="flex items-center space-x-3 mb-2">
        <!-- 错误消息头像 -->
        <div v-if="message.type === 'error'" class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">!</div>
        <!-- 工具消息头像 -->
        <div
          v-else-if="message.type === 'tool'"
          class="w-8 h-8 bg-gray-600 dark:bg-gray-700 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
        >
          🔧
        </div>
        <!-- AI 消息头像 (根据 provider 显示不同 Logo) -->
        <div v-else class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 p-1">
          <!-- Claude Logo -->
          <ClaudeLogo v-if="(selectedProvider || 'claude') === 'claude'" class="w-full h-full" />
          <!-- Cursor Logo -->
          <!-- <CursorLogo v-else-if="(selectedProvider || 'claude') === 'cursor'" class="w-full h-full" /> -->
          <!-- Codex Logo -->
          <!-- <CodexLogo v-else class="w-full h-full" /> -->
        </div>

        <!-- 消息类型标签 -->
        <div class="text-sm font-medium text-gray-900 dark:text-white">
          {{ getMessageTypeLabel() }}
        </div>
      </div>

      <!-- 这里是消息内容容器 -->
      <div class="w-full">
        <!-- ========================================================
             子分支 2.2: 这里是工具调用渲染分支 (排除 Read/TodoWrite/TodoRead)
             ======================================================== -->
        <div v-if="message.isToolUse && !['Read', 'TodoWrite', 'TodoRead'].includes(message.toolName)">
          <!-- ========================================================
               这里是搜索工具简化视图分支 (Grep/Glob)
               ======================================================== -->
          <div
            v-if="isSearchTool(message.toolName)"
            class="group relative bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-blue-400 dark:border-blue-500 pl-3 py-2 my-2"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-1 min-w-0">
                <!-- 搜索图标 -->
                <svg class="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <!-- 工具名称 -->
                <span class="font-medium flex-shrink-0">{{ message.toolName }}</span>
                <span class="text-gray-400 dark:text-gray-500 flex-shrink-0">•</span>
                <!-- 搜索参数 -->
                <span v-if="message.toolInput" class="font-mono truncate flex-1 min-w-0">
                  <span v-if="parsedToolInput.pattern">
                    模式<span class="text-blue-600 dark:text-blue-400">{{ parsedToolInput.pattern }}</span>
                  </span>
                  <span v-if="parsedToolInput.path" class="ml-2">在： {{ parsedToolInput.path }}</span>
                </span>
              </div>
              <!-- 搜索结果链接 -->
              <!-- <a
                v-if="message.toolResult"
                :href="`#tool-result-${message.toolId}`"
                class="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
              >
                <span>搜索结果：</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </a> -->
            </div>
          </div>

          <!-- ========================================================
               这里是其他工具完整视图分支 (非搜索工具)
               ======================================================== -->
          <div
            v-else
            class="group relative bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/30 dark:border-blue-800/30 rounded-lg p-3 mb-2"
          >
            <!-- 工具信息头部 -->
            <div class="relative flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <!-- 工具图标 -->
                <div
                  class="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 dark:shadow-blue-400/20"
                >
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <!-- 脉冲动画 -->
                  <div class="absolute inset-0 rounded-lg bg-blue-500 dark:bg-blue-400 animate-pulse opacity-20"></div>
                </div>
                <!-- 工具名称和 ID -->
                <div class="flex flex-col">
                  <span class="font-semibold text-gray-900 dark:text-white text-sm">
                    {{ toolNameReflect[message.toolName] || message.toolName }}
                  </span>
                  <!-- <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {{ message.toolId }}
                  </span> -->
                </div>
              </div>
              <!-- 设置按钮 -->
              <button
                v-if="onShowSettings"
                @click.stop="onShowSettings"
                class="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200 group/btn backdrop-blur-sm"
                title="设置"
              >
                <svg
                  class="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <!-- ========================================================
                 这里是 Edit 工具特殊处理分支 (显示 diff)
                 ======================================================== -->
            <div v-if="message.toolInput && message.toolName === 'Edit' && parsedEditInput">
              <details :open="autoExpandTools" class="relative mt-3 group/details">
                <summary
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <svg class="w-4 h-4 transition-transform duration-200 group-open/details:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span class="flex items-center gap-2">
                    <span>文件修改对比</span>
                  </span>
                  <!-- 文件名按钮 -->
                  <button
                    @click.prevent.stop="handleEditFileOpen(parsedEditInput.file_path)"
                    class="px-2.5 py-1 rounded-md bg-white/60 dark:bg-gray-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-mono text-xs font-medium transition-all duration-200 shadow-sm"
                  >
                    {{ parsedEditInput.file_path.split('/').pop() }}
                  </button>
                </summary>
                <div class="mt-3 pl-6">
                  <editLinesDiff :message="props.message" :createDiff="props.createDiff" :onFileOpen="props.onFileOpen" />
                  <!-- 这里是原始参数显示分支 (showRawParameters 为 true 时) -->
                  <details v-if="showRawParameters" :open="autoExpandTools" class="relative mt-3 pl-6 group/raw">
                    <summary
                      class="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                    >
                      <svg class="w-3 h-3 transition-transform duration-200 group-open/raw:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      查看原始参数
                    </summary>
                    <pre
                      class="mt-2 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 p-3 rounded-lg whitespace-pre-wrap break-words overflow-hidden text-gray-700 dark:text-gray-300 font-mono"
                    >
                      {{ message.toolInput }}
                    </pre>
                  </details>
                </div>
              </details>
            </div>

            <!-- ========================================================
                 这里是 Write 工具特殊处理分支 (新文件创建)
                 ======================================================== -->
            <div v-else-if="message.toolInput && message.toolName === 'Write' && parsedWriteInput">
              <details :open="autoExpandTools" class="relative mt-3 group/details">
                <summary
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <svg class="w-4 h-4 transition-transform duration-200 group-open/details:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span class="flex items-center gap-2">
                    <span class="text-lg leading-none">📄</span>
                    <span>创建新文件:</span>
                  </span>
                  <button
                    @click.prevent.stop="handleWriteFileOpen(parsedWriteInput.file_path)"
                    class="px-2.5 py-1 rounded-md bg-white/60 dark:bg-gray-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-mono text-xs font-medium transition-all duration-200 shadow-sm"
                  >
                    {{ parsedWriteInput.file_path.split('/').pop() }}
                  </button>
                </summary>
                <div class="mt-3 pl-6">
                  <writLinesDiff :message="props.message" :createDiff="props.createDiff" :onFileOpen="props.onFileOpen" />
                  <!-- 原始参数 -->
                  <details v-if="showRawParameters" :open="autoExpandTools" class="relative mt-3 pl-6 group/raw">
                    <summary
                      class="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                    >
                      <svg class="w-3 h-3 transition-transform duration-200 group-open/raw:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      查看原始参数
                    </summary>
                    <pre
                      class="mt-2 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 p-3 rounded-lg whitespace-pre-wrap break-words overflow-hidden text-gray-700 dark:text-gray-300 font-mono"
                    >
                      {{ message.toolInput }}
                    </pre>
                  </details>
                </div>
              </details>
            </div>

            <!-- ========================================================
                 这里是 TodoWrite 工具特殊处理分支
                 ======================================================== -->
            <div v-else-if="message.toolInput && message.toolName === 'TodoWrite' && parsedTodoWriteInput">
              <details :open="autoExpandTools" class="relative mt-3 group/todo">
                <summary
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <svg class="w-4 h-4 transition-transform duration-200 group-open/todo:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span class="flex items-center gap-2">
                    <span class="text-lg leading-none">✓</span>
                    <span>更新待办列表</span>
                  </span>
                </summary>
                <div class="mt-3">
                  <!-- TODO: TodoList 组件占位 -->
                  <todoList :todos="parsedTodoWriteInput.todos" />
                  <!-- 原始参数 -->
                  <details v-if="showRawParameters" :open="autoExpandTools" class="relative mt-3 group/raw">
                    <summary
                      class="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                    >
                      <svg class="w-3 h-3 transition-transform duration-200 group-open/raw:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>

                      查看原始参数
                    </summary>
                    <pre
                      class="mt-2 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 p-3 rounded-lg overflow-x-auto text-gray-700 dark:text-gray-300 font-mono"
                    >
                      {{ message.toolInput }}
                    </pre>
                  </details>
                </div>
              </details>
            </div>

            <!-- ========================================================
                 这里是 Bash 工具特殊处理分支
                 ======================================================== -->
            <div v-else-if="message.toolInput && message.toolName === 'Bash' && parsedBashInput">
              <div class="my-2">
                <div class="bg-gray-900 dark:bg-gray-950 rounded-md px-3 py-2 font-mono text-sm">
                  <span class="text-green-400">$</span>
                  <span class="text-gray-100 ml-2">{{ parsedBashInput.command }}</span>
                </div>
                <div v-if="parsedBashInput.description" class="mt-1 text-xs text-gray-500 dark:text-gray-400 italic ml-1">
                  {{ parsedBashInput.description }}
                </div>
              </div>
            </div>

            <!-- ========================================================
                 这里是 ExitPlanMode 工具特殊处理分支
                 ======================================================== -->
            <div v-else-if="message.toolInput && message.toolName === 'ExitPlanMode' && parsedExitPlanInput">
              <details :open="autoExpandTools" class="mt-2">
                <summary class="text-sm text-blue-700 dark:text-blue-300 cursor-pointer hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-2">
                  <svg class="w-4 h-4 transition-transform details-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  📋 实施计划
                </summary>
                <!-- Markdown 组件占位 -->
                <MessageResponse class="mt-3 p-3 prose prose-sm max-w-none dark:prose-invert" :content="parsedExitPlanInput.plan"> </MessageResponse>
              </details>
            </div>
            <!-- ========================================================
                 这里是 Skill 工具特殊处理分支
                 ======================================================== -->
            <div v-else-if="message.toolInput && message.toolName === 'Skill' && parsedSkillInput">
              调用技能： 📄{{ parsedSkillInput.skill }} - 🛠️{{ parsedSkillInput.args }}
            </div>
            <!-- ========================================================
                 这里是其他工具通用参数显示分支
                 ======================================================== -->
            <div v-else-if="message.toolInput">
              <details :open="autoExpandTools" class="relative mt-3 group/params">
                <summary
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <svg class="w-4 h-4 transition-transform duration-200 group-open/params:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  查看入参
                </summary>
                <pre
                  class="mt-3 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 p-3 rounded-lg whitespace-pre-wrap break-words overflow-hidden text-gray-700 dark:text-gray-300 font-mono"
                >
                  {{ message.toolInput }}
                </pre>
              </details>
            </div>

            <!-- ========================================================
               这里是工具结果渲染分支
               ======================================================== -->
            <div v-if="message.toolResult && shouldShowToolResult">
              <toolResult :message="message" />
            </div>
          </div>
        </div>

        <!-- ========================================================
             子分支 2.3: 这里是 Read 工具简化视图分支
             ======================================================== -->
        <div v-else-if="message.isToolUse && message.toolName === 'Read'">
          <div v-if="parsedReadInput" class="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
            <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span class="font-medium">读取文件</span>
              <button
                @click="onFileOpen && onFileOpen(parsedReadInput.file_path)"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-mono transition-colors"
              >
                {{ parsedReadInput.file_path.split('/').pop() }}
              </button>
            </div>
          </div>
          <!-- 解析失败时的后备显示 -->
          <div v-else class="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
            <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span class="font-medium">Read file</span>
            </div>
          </div>
        </div>

        <!-- ========================================================
             子分支 2.4: 这里是 TodoWrite 工具简化视图分支
             ======================================================== -->
        <div v-else-if="message.isToolUse && message.toolName === 'TodoWrite'">
          <div v-if="parsedTodoWriteInput" class="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
            <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
              <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span class="font-medium">更新待办列表</span>
            </div>
            <!-- TODO: TodoList 组件占位 -->
            <todoList :todos="parsedTodoWriteInput.todos" />
          </div>
          <!-- 解析失败时的后备显示 -->
          <div v-else class="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
            <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span class="font-medium">更新待办列表</span>
            </div>
          </div>
        </div>

        <!-- ========================================================
             子分支 2.5: 这里是 TodoRead 工具简化视图分支
             ======================================================== -->
        <div
          v-else-if="message.isToolUse && message.toolName === 'TodoRead'"
          class="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2"
        >
          <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span class="font-medium">Read todo list</span>
          </div>
        </div>

        <!-- ========================================================
             子分支 2.6: 这里是思考中消息渲染分支
             ======================================================== -->
        <div v-else-if="message.isThinking" class="text-sm text-gray-700 dark:text-gray-300">
          <details class="group" :open="false">
            <summary class="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium flex items-center gap-2">
              <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>💭思考...</span>
            </summary>
            <div class="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm">
              <!--  Markdown 组件占位 -->
              <MessageResponse class="prose prose-sm max-w-none dark:prose-invert prose-gray" :content="message.content"> </MessageResponse>
            </div>
          </details>
        </div>

        <!-- ========================================================
             子分支 2.7: 这里是普通 AI 消息渲染分支
             ======================================================== -->
        <div v-else class="text-sm text-gray-700 dark:text-gray-300">
          <!-- 思考过程折叠面板 (showThinking 为 true 时显示) -->
          <details v-if="showThinking && message.reasoning" class="mb-3">
            <summary class="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">💭思考...</summary>
            <div class="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600 italic text-gray-600 dark:text-gray-400 text-sm">
              <div class="whitespace-pre-wrap">
                {{ message.reasoning }}
              </div>
            </div>
          </details>

          <!-- ================================================================
               这里是 JSON 响应特殊处理分支
               ================================================================ -->
          <div v-if="isJsonContent" class="my-2">
            <div class="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span class="font-medium">JSON Response</span>
            </div>
            <div class="bg-gray-800 dark:bg-gray-900 border border-gray-600/30 dark:border-gray-700 rounded-lg overflow-hidden">
              <pre class="p-4 overflow-x-auto">
                <code class="text-gray-100 dark:text-gray-200 text-sm font-mono block whitespace-pre">
                  {{ formattedJsonContent }}
                </code>
              </pre>
            </div>
          </div>

          <!-- ================================================================
               这里是普通 MessageResponse 内容渲染分支 (assistant 类型消息)
               ================================================================ -->
          <MessageResponse v-else-if="message.type === 'assistant'" :content="formattedContent" class="prose prose-sm max-w-none dark:prose-invert prose-gray">
          </MessageResponse>

          <!-- ================================================================
               这里是普通文本内容渲染分支 (非 assistant 类型)
               ================================================================ -->
          <MessageResponse v-else class="whitespace-pre-wrap" :content="formattedContent"> </MessageResponse>
        </div>
      </div>

      <!-- 时间戳 -->
      <div :class="['text-xs text-gray-500 dark:text-gray-400 mt-1', isGrouped ? 'opacity-0 group-hover:opacity-100' : '']">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>
