<script setup lang="ts">
import { DiffLine, Message, PermissionSuggestion, Provider, ToolUseMessage } from '../../hooks/utils/message'
import { Project } from '../../types'
import ClaudeLogo from './ClaudeLogo.vue'

// TODO: 这些组件需要后续实现，先用占位符
import { MessageResponse } from '@/components/ai-elements/message'

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
  showRawParameters: false,
  showThinking: false,
  selectedProject: null,
  provider: 'claude',
})
// ========================================================
// Refs
// ========================================================
const messageRef = ref(null)
const permissionGrantState = ref('idle')
const selectedProvider = ref(props.provider || localStorage.getItem('selected-provider') || 'claude')

// ========================================================
// 计算属性
// ========================================================

// 判断消息是否分组
const isGrouped = computed(() => {
  return props.prevMessage && props.prevMessage.type === props.message.type && ['assistant', 'user', 'tool', 'error'].includes(props.message.type)
})

// 权限建议 (从原代码的 getClaudePermissionSuggestion 获取)
const permissionSuggestion = computed(() => {
  // TODO: 实现权限建议逻辑
  return null
})

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

// Edit 工具的 diff 行
const editDiffLines = computed(() => {
  if (!parsedEditInput.value) return []
  return props.createDiff(parsedEditInput.value.old_string, parsedEditInput.value.new_string)
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

// Write 工具的 diff 行
const writeDiffLines = computed(() => {
  if (!parsedWriteInput.value) return []
  return props.createDiff('', parsedWriteInput.value.content)
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

// 简化的 TodoWrite 输入 (用于简化视图)
const parsedTodoWriteInputSimple = computed(() => {
  return parsedTodoWriteInput.value
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

// 解析 exit_plan_mode 工具输入
const parsedExitPlanInput = computed(() => {
  if (props.message.toolName !== 'exit_plan_mode' || !props.message.toolInput) return null
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

// 交互式提示的问题
const interactivePromptQuestion = computed(() => {
  if (!props.message.isInteractivePrompt || !props.message.content) return ''
  const lines = props.message.content.split('\n').filter((line) => line.trim())
  return lines.find((line) => line.includes('?')) || lines[0] || ''
})

// 交互式提示的选项
const interactivePromptOptions = computed(() => {
  if (!props.message.isInteractivePrompt || !props.message.content) return []
  const lines = props.message.content.split('\n').filter((line) => line.trim())
  const options: {
    number: string
    text: string
    isSelected: boolean
  }[] = []

  lines.forEach((line) => {
    const optionMatch = line.match(/[❯\s]*(\d+)\.\s+(.+)/)
    if (optionMatch) {
      const isSelected = line.includes('❯')
      options.push({
        number: optionMatch[1],
        text: optionMatch[2].trim(),
        isSelected,
      })
    }
  })

  return options
})

// 格式化内容
const formattedContent = computed(() => {
  const content = String(props.message.content || '')
  // TODO: 实现 formatUsageLimitText 逻辑
  console.log('content', content)
  return content
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
  // TODO: 实现文件 diff 逻辑
  props.onFileOpen(filePath)
}

// 处理 Write 文件打开
async function handleWriteFileOpen(filePath: string) {
  if (!props.onFileOpen) return
  // TODO: 实现文件 diff 逻辑
  props.onFileOpen(filePath, {
    old_string: '',
    new_string: parsedWriteInput.value?.content || '',
  })
}

// 处理授予权限
function handleGrantPermission() {
  if (!props.onGrantToolPermission || !permissionSuggestion.value) return
  const result = props.onGrantToolPermission(permissionSuggestion.value)
  if (result?.success) {
    permissionGrantState.value = 'granted'
  } else {
    permissionGrantState.value = 'error'
  }
}

const openImg = (img: string) => {
  window.open(img, '_blank')
}
</script>

<template>
  <div
    ref="messageRef"
    :class="['chat-message', message.type, isGrouped ? 'grouped' : '', message.type === 'user' ? 'flex justify-end px-3 sm:px-0' : 'px-3 sm:px-0']"
  >
    <!-- ========================================================
         分支1: 这里是用户消息渲染分支 (右侧蓝色气泡)
         ======================================================== -->
    <div v-if="message.type === 'user'" class="flex items-end space-x-0 sm:space-x-3 w-full sm:w-auto sm:max-w-[85%] md:max-w-md lg:max-w-lg xl:max-w-xl">
      <!-- 用户消息气泡 -->
      <div class="bg-blue-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 shadow-sm flex-1 sm:flex-initial">
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
        <div class="text-xs text-blue-100 mt-1 text-right">
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
             子分支 2.1: 这里是工具调用渲染分支 (排除 Read/TodoWrite/TodoRead)
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
                    {{ $t('search.pattern') }} <span class="text-blue-600 dark:text-blue-400">{{ parsedToolInput.pattern }}</span>
                  </span>
                  <span v-if="parsedToolInput.path" class="ml-2">{{ $t('search.in') }} {{ parsedToolInput.path }}</span>
                </span>
              </div>
              <!-- 搜索结果链接 -->
              <a
                v-if="message.toolResult"
                :href="`#tool-result-${message.toolId}`"
                class="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
              >
                <span>{{ $t('tools.searchResults') }}</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          <!-- ========================================================
               这里是其他工具完整视图分支 (非搜索工具)
               ======================================================== -->
          <div
            v-else
            class="group relative bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/30 dark:border-blue-800/30 rounded-lg p-3 mb-2"
          >
            <!-- 装饰性渐变覆盖层 -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-indigo-500/3 dark:from-blue-400/3 dark:to-indigo-400/3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>

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
                    {{ message.toolName }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {{ message.toolId }}
                  </span>
                </div>
              </div>
              <!-- 设置按钮 -->
              <button
                v-if="onShowSettings"
                @click.stop="onShowSettings"
                class="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200 group/btn backdrop-blur-sm"
                :title="$t('tools.settings')"
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
                    <span>View edit diff for</span>
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
                  <!-- Diff 显示区域 -->
                  <div class="bg-white dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 rounded-lg overflow-hidden shadow-sm">
                    <div
                      class="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/80 dark:to-gray-800/40 border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm"
                    >
                      <button
                        @click="handleEditFileOpen(parsedEditInput.file_path)"
                        class="text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate cursor-pointer font-medium transition-colors"
                      >
                        {{ parsedEditInput.file_path }}
                      </button>
                      <span class="text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded"> Diff </span>
                    </div>
                    <!-- Diff 行列表 -->
                    <div class="text-xs font-mono">
                      <div v-for="(diffLine, i) in editDiffLines" :key="i" class="flex">
                        <span
                          :class="[
                            'w-8 text-center border-r',
                            diffLine.type === 'removed'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                              : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
                          ]"
                        >
                          {{ diffLine.type === 'removed' ? '-' : '+' }}
                        </span>
                        <span
                          :class="[
                            'px-2 py-0.5 flex-1 whitespace-pre-wrap',
                            diffLine.type === 'removed'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
                          ]"
                        >
                          {{ diffLine.content }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <!-- 这里是原始参数显示分支 (showRawParameters 为 true 时) -->
                  <details v-if="showRawParameters" :open="autoExpandTools" class="relative mt-3 pl-6 group/raw">
                    <summary
                      class="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                    >
                      <svg class="w-3 h-3 transition-transform duration-200 group-open/raw:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      View raw parameters
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
                    <span>Creating new file:</span>
                  </span>
                  <button
                    @click.prevent.stop="handleWriteFileOpen(parsedWriteInput.file_path)"
                    class="px-2.5 py-1 rounded-md bg-white/60 dark:bg-gray-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-mono text-xs font-medium transition-all duration-200 shadow-sm"
                  >
                    {{ parsedWriteInput.file_path.split('/').pop() }}
                  </button>
                </summary>
                <div class="mt-3 pl-6">
                  <div class="bg-white dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 rounded-lg overflow-hidden shadow-sm">
                    <div
                      class="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/80 dark:to-gray-800/40 border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm"
                    >
                      <button
                        @click="handleWriteFileOpen(parsedWriteInput.file_path)"
                        class="text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate cursor-pointer font-medium transition-colors"
                      >
                        {{ parsedWriteInput.file_path }}
                      </button>
                      <span
                        class="text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
                      >
                        New File
                      </span>
                    </div>
                    <!-- Diff 显示 -->
                    <div class="text-xs font-mono">
                      <div v-for="(diffLine, i) in writeDiffLines" :key="i" class="flex">
                        <span
                          :class="[
                            'w-8 text-center border-r',
                            diffLine.type === 'removed'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                              : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
                          ]"
                        >
                          {{ diffLine.type === 'removed' ? '-' : '+' }}
                        </span>
                        <span
                          :class="[
                            'px-2 py-0.5 flex-1 whitespace-pre-wrap',
                            diffLine.type === 'removed'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
                          ]"
                        >
                          {{ diffLine.content }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <!-- 原始参数 -->
                  <details v-if="showRawParameters" :open="autoExpandTools" class="relative mt-3 pl-6 group/raw">
                    <summary
                      class="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                    >
                      <svg class="w-3 h-3 transition-transform duration-200 group-open/raw:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      View raw parameters
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
                    <span>Updating Todo List</span>
                  </span>
                </summary>
                <div class="mt-3">
                  <!-- TODO: TodoList 组件占位 -->
                  TodoList
                  <!-- <TodoList :todos="parsedTodoWriteInput.todos" /> -->
                  <!-- 原始参数 -->
                  <details v-if="showRawParameters" :open="autoExpandTools" class="relative mt-3 group/raw">
                    <summary
                      class="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                    >
                      <svg class="w-3 h-3 transition-transform duration-200 group-open/raw:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      View raw parameters
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
                 这里是 exit_plan_mode 工具特殊处理分支
                 ======================================================== -->
            <div v-else-if="message.toolInput && message.toolName === 'exit_plan_mode' && parsedExitPlanInput">
              <details :open="autoExpandTools" class="mt-2">
                <summary class="text-sm text-blue-700 dark:text-blue-300 cursor-pointer hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-2">
                  <svg class="w-4 h-4 transition-transform details-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  📋 View implementation plan
                </summary>
                <!-- TODO: Markdown 组件占位 -->
                <!-- <MessageContent> -->
                <MessageResponse class="mt-3 prose prose-sm max-w-none dark:prose-invert" :content="parsedExitPlanInput.plan"> </MessageResponse>
                <!-- </MessageContent> -->
              </details>
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
                  View input parameters
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
              <div
                :id="`tool-result-${message.toolId}`"
                :class="[
                  'relative mt-4 p-4 rounded-lg border backdrop-blur-sm scroll-mt-4',
                  message.toolResult.isError
                    ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200/60 dark:border-red-800/60'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/60 dark:border-green-800/60',
                ]"
              >
                <!-- 装饰性渐变覆盖层 -->
                <div
                  :class="[
                    'absolute inset-0 rounded-lg opacity-50',
                    message.toolResult.isError
                      ? 'bg-gradient-to-br from-red-500/5 to-rose-500/5 dark:from-red-400/5 dark:to-rose-400/5'
                      : 'bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-400/5 dark:to-emerald-400/5',
                  ]"
                ></div>

                <!-- 结果头部 -->
                <div class="relative flex items-center gap-2.5 mb-3">
                  <div
                    :class="[
                      'w-6 h-6 rounded-lg flex items-center justify-center shadow-md',
                      message.toolResult.isError
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-400 dark:to-rose-500 shadow-red-500/20'
                        : 'bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 shadow-green-500/20',
                    ]"
                  >
                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path v-if="message.toolResult.isError" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span
                    :class="['text-sm font-semibold', message.toolResult.isError ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200']"
                  >
                    {{ message.toolResult.isError ? 'Tool Error' : 'Tool Result' }}
                  </span>
                </div>

                <!-- 结果内容 -->
                <div :class="['relative text-sm', message.toolResult.isError ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100']">
                  <!-- TODO: 这里的工具结果渲染逻辑比较复杂，需要处理多种特殊情况 -->
                  <!-- 例如：TodoList 结果、Grep/Glob 结果、交互式提示结果等 -->
                  <!-- 暂时使用 MessageResponse 渲染 -->
                  <!-- <MessageContent> -->
                  <MessageResponse class="prose prose-sm max-w-none prose-green dark:prose-invert"> </MessageResponse>
                  <!-- </MessageContent> -->
                </div>

                <!-- 权限建议分支 -->
                <div v-if="permissionSuggestion" class="mt-4 border-t border-red-200/60 dark:border-red-800/60 pt-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      @click="handleGrantPermission"
                      :disabled="permissionSuggestion.isAllowed || permissionGrantState === 'granted'"
                      :class="[
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                        permissionSuggestion.isAllowed || permissionGrantState === 'granted'
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-300/70 dark:border-green-800/60 text-green-800 dark:text-green-200 cursor-default'
                          : 'bg-white/80 dark:bg-gray-900/40 border-red-300/70 dark:border-red-800/60 text-red-700 dark:text-red-200 hover:bg-white dark:hover:bg-gray-900/70',
                      ]"
                    >
                      {{
                        permissionSuggestion.isAllowed || permissionGrantState === 'granted'
                          ? 'Permission added'
                          : `Grant permission for ${permissionSuggestion.toolName}`
                      }}
                    </button>
                    <button
                      v-if="onShowSettings"
                      type="button"
                      @click.stop="onShowSettings"
                      class="text-xs text-red-700 dark:text-red-200 underline hover:text-red-800 dark:hover:text-red-100"
                    >
                      Open settings
                    </button>
                  </div>
                  <div class="mt-2 text-xs text-red-700/90 dark:text-red-200/80">
                    Adds <span class="font-mono">{{ permissionSuggestion.entry }}</span> to Allowed Tools.
                  </div>
                  <div v-if="permissionGrantState === 'error'" class="mt-2 text-xs text-red-700 dark:text-red-200">
                    Unable to update permissions. Please try again.
                  </div>
                  <div v-if="permissionSuggestion.isAllowed || permissionGrantState === 'granted'" class="mt-2 text-xs text-green-700 dark:text-green-200">
                    Permission saved. Retry the request to use the tool.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================
             子分支 2.2: 这里是交互式提示渲染分支
             ======================================================== -->
        <div v-else-if="message.isInteractivePrompt" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-amber-900 dark:text-amber-100 text-base mb-3">Interactive Prompt</h4>
              <!-- 问题文本 -->
              <p class="text-sm text-amber-800 dark:text-amber-200 mb-4">
                {{ interactivePromptQuestion }}
              </p>

              <!-- 选项按钮列表 -->
              <div class="space-y-2 mb-4">
                <t-button
                  v-for="option in interactivePromptOptions"
                  :key="option.number"
                  :class="[
                    'w-full text-left px-4 py-3 rounded-lg border-2 transition-all cursor-not-allowed opacity-75',
                    option.isSelected
                      ? 'bg-amber-600 dark:bg-amber-700 text-white border-amber-600 dark:border-amber-700 shadow-md'
                      : 'bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700',
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <span
                      :class="[
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        option.isSelected ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-800/50',
                      ]"
                    >
                      {{ option.number }}
                    </span>
                    <span class="text-sm sm:text-base font-medium flex-1">
                      {{ option.text }}
                    </span>
                    <svg v-if="option.isSelected" class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </t-button>
              </div>

              <!-- 等待提示 -->
              <div class="bg-amber-100 dark:bg-amber-800/30 rounded-lg p-3">
                <p class="text-amber-900 dark:text-amber-100 text-sm font-medium mb-1">⏳ Waiting for your response in the CLI</p>
                <p class="text-amber-800 dark:text-amber-200 text-xs">Please select an option in your terminal where Claude is running.</p>
              </div>
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
              <span class="font-medium">Read</span>
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
          <div v-if="parsedTodoWriteInputSimple" class="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
            <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
              <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span class="font-medium">Update todo list</span>
            </div>
            <!-- TODO: TodoList 组件占位 -->
            TodoList
            <!-- <TodoList :todos="parsedTodoWriteInputSimple.todos" /> -->
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
              <span class="font-medium">Update todo list</span>
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
          <details class="group">
            <summary class="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium flex items-center gap-2">
              <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>💭 Thinking...</span>
            </summary>
            <div class="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm">
              <!-- TODO: Markdown 组件占位 -->
              <!-- <MessageContent> -->
              <MessageResponse class="prose prose-sm max-w-none dark:prose-invert prose-gray" :content="message.content"> </MessageResponse>
              <!-- </MessageContent> -->
            </div>
          </details>
        </div>

        <!-- ========================================================
             子分支 2.7: 这里是普通 AI 消息渲染分支
             ======================================================== -->
        <div v-else class="text-sm text-gray-700 dark:text-gray-300">
          <!-- 思考过程折叠面板 (showThinking 为 true 时显示) -->
          <details v-if="showThinking && message.reasoning" class="mb-3">
            <summary class="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">💭 Thinking...</summary>
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
