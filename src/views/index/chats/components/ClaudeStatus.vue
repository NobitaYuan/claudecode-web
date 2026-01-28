<script setup lang="ts">
/**
 * ============================================================
 * Props 定义
 * ============================================================
 */
interface Status {
  text?: string // 自定义状态文本
  tokens?: number // 实际 token 数量
  can_interrupt?: boolean // 是否可以中断
}

interface Props {
  /** 状态对象 */
  status?: Status | null
  /** 中止回调 */
  onAbort?: () => void
  /** 是否加载中 */
  isLoading: boolean
  /** AI 提供商 */
  provider?: 'claude' | 'cursor' | 'codex'
}

const props = withDefaults(defineProps<Props>(), {
  status: null,
  onAbort: undefined,
  isLoading: false,
  provider: 'claude',
})

/**
 * ============================================================
 * 状态定义
 * ============================================================
 */

// 已用时间（秒）
const elapsedTime = ref(0)

// 动画阶段（0-3 循环）
const animationPhase = ref(0)

// 模拟 token 数量
const fakeTokens = ref(0)

// Token 速率（30-50 tokens/秒）
const tokenRate = 30 + Math.random() * 20

// ============================================================
// 定时器引用
// ============================================================
let elapsedTimeTimer: number | null = null
let animationTimer: number | null = null

/**
 * ============================================================
 * 计算属性
 * ============================================================
 */

/**
 * 显示的状态文本
 * 优先使用 status.text，否则使用循环的动作词
 */
const displayStatusText = computed(() => {
  // 如果有自定义状态文本，优先使用
  if (props.status?.text) {
    return props.status.text
  }

  // 动作词数组（每3秒切换一次）
  const actionWords = ['Thinking', 'Processing', 'Analyzing', 'Working', 'Computing', 'Reasoning']

  // 根据时间计算当前应该显示的动作词
  const actionIndex = Math.floor(elapsedTime.value / 3) % actionWords.length
  return actionWords[actionIndex]
})

/**
 * 显示的 token 数量
 * 优先使用实际 tokens，否则使用模拟值
 */
const displayTokens = computed(() => {
  // 如果有实际 token 数量，优先使用
  if (props.status?.tokens !== undefined) {
    return props.status.tokens
  }

  // 否则使用模拟值
  return fakeTokens.value
})

/**
 * 是否可以中断
 * 默认为 true，除非明确设置为 false
 */
const canInterrupt = computed(() => {
  return props.status?.can_interrupt !== false
})

/**
 * ============================================================
 * 监听器：更新计时器和动画
 * ============================================================
 */

/**
 * 更新已用时间和模拟 token 数量
 */
const startTimers = () => {
  // 记录开始时间
  const startTime = Date.now()

  // 每秒更新一次已用时间
  elapsedTimeTimer = window.setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    elapsedTime.value = elapsed

    // 模拟 token 数量增加
    fakeTokens.value = Math.floor(elapsed * tokenRate)
  }, 1000) as unknown as number
}

/**
 * 更新动画阶段（每 500ms 切换一次 spinner）
 */
const startAnimation = () => {
  animationTimer = window.setInterval(() => {
    animationPhase.value = (animationPhase.value + 1) % 4
  }, 500) as unknown as number
}

/**
 * 停止计时器
 */
const stopTimers = () => {
  if (elapsedTimeTimer) {
    clearInterval(elapsedTimeTimer)
    elapsedTimeTimer = null
  }
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
}

/**
 * 重置状态
 */
const resetState = () => {
  elapsedTime.value = 0
  animationPhase.value = 0
  fakeTokens.value = 0
}

/**
 * ============================================================
 * 监听 props 变化
 * ============================================================
 */

// 监听 isLoading 变化
watch(
  () => props.isLoading,
  (newValue) => {
    if (newValue) {
      // 开始加载：启动计时器和动画
      resetState()
      startTimers()
      startAnimation()
    } else {
      // 停止加载：清除计时器并重置状态
      stopTimers()
      resetState()
    }
  },
  { immediate: true },
)

/**
 * ============================================================
 * 组件卸载时清理定时器
 * ============================================================
 */
onUnmounted(() => {
  stopTimers()
})
</script>
<template>
  <!-- ========================================================
   这里是条件渲染分支：仅当 isLoading 为 true 时显示
   ======================================================== -->
  <div v-if="isLoading" class="w-full mb-3 sm:mb-6 animate-in slide-in-from-bottom duration-300">
    <div
      class="flex items-center justify-between max-w-4xl mx-auto bg-gray-800 dark:bg-gray-900 text-white rounded-lg shadow-lg px-2.5 py-2 sm:px-4 sm:py-3 border border-gray-700 dark:border-gray-800"
    >
      <!-- ========================================================
           左侧：动画 Spinner + 状态信息
           ======================================================== -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- ========================================================
               这里是动画 Spinner 分支
               根据 animationPhase 切换不同图标
               ======================================================== -->
          <span
            :class="['text-base sm:text-xl transition-all duration-500 flex-shrink-0', animationPhase % 2 === 0 ? 'text-blue-400 scale-110' : 'text-blue-300']"
          >
            <!-- Spinner 图标（4个循环显示） -->
            <span v-if="animationPhase === 0">✻</span>
            <span v-else-if="animationPhase === 1">✹</span>
            <span v-else-if="animationPhase === 2">✸</span>
            <span v-else>✶</span>
          </span>

          <!-- ========================================================
               这里是状态文本和统计信息容器
               ======================================================== -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <!-- 状态文本（如：Thinking, Processing...） -->
              <span class="font-medium text-xs sm:text-sm truncate"> {{ displayStatusText }}... </span>

              <!-- 已用时间 -->
              <span class="text-gray-400 text-xs sm:text-sm flex-shrink-0"> ({{ elapsedTime }}s) </span>

              <!-- 这里是 Token 数量显示分支（当 tokens > 0 时） -->
              <template v-if="displayTokens > 0">
                <!-- 桌面端隐藏，移动端显示 -->
                <span class="text-gray-500 hidden sm:inline">·</span>
                <span class="text-gray-300 text-xs sm:text-sm hidden sm:inline flex-shrink-0"> ⚒ {{ displayTokens.toLocaleString() }} </span>
              </template>

              <!-- 分隔符（桌面端显示） -->
              <span class="text-gray-500 hidden sm:inline">·</span>

              <!-- 提示信息 -->
              <span class="text-gray-400 text-xs sm:text-sm hidden sm:inline"> esc to stop </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================
           右侧：中止按钮分支
           当 canInterrupt 为 true 且存在 onAbort 回调时显示
           ======================================================== -->
      <button
        v-if="canInterrupt && onAbort"
        @click="onAbort"
        class="ml-2 sm:ml-3 text-xs bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md transition-colors flex items-center gap-1 sm:gap-1.5 flex-shrink-0 font-medium"
      >
        <!-- X 图标 -->
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <!-- 按钮文本（移动端隐藏，桌面端显示） -->
        <span class="hidden sm:inline">Stop</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   这里是进入动画
   ============================================================ */
@keyframes slide-in-from-bottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation-fill-mode: both;
}

.duration-300 {
  animation-duration: 300ms;
}

/* ============================================================
   响应式文本溢出处理
   ============================================================ */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============================================================
   移动端优化
   ============================================================ */
@media (max-width: 640px) {
  .hidden.sm\:inline {
    display: none;
  }
}

@media (min-width: 640px) {
  .hidden.sm\:inline {
    display: inline;
  }
}
</style>

<!--
============================================================
使用示例
============================================================

<script setup lang="ts">
import ClaudeStatus from './components/ClaudeStatus.vue'
import { ref } from 'vue'

const isLoading = ref(false)
const status = ref(null)

function handleAbort() {
  console.log('中止操作')
  isLoading.value = false
}
</script>

<template>
  <div>
    <ClaudeStatus
      :isLoading="isLoading"
      :status="status"
      :onAbort="handleAbort"
      provider="claude"
    />

    <button @click="isLoading = true">开始</button>
  </div>
</template>

============================================================
在 ChatInterface 中使用
============================================================

<script setup lang="ts">
import { ref } from 'vue'
import ClaudeStatus from './ClaudeStatus.vue'

const claudeStatus = ref({
  text: 'Processing...',
  tokens: 0,
  can_interrupt: true
})
const isLoading = ref(false)

function handleAbortSession() {
  // 中止会话逻辑
  isLoading.value = false
}
</script>

<template>
  <ClaudeStatus
    :status="claudeStatus"
    :isLoading="isLoading"
    :onAbort="handleAbortSession"
    provider="selectedProvider"
  />
</template>

============================================================
状态类型说明
============================================================

interface Status {
  text?: string           // 自定义状态文本
  tokens?: number         // 实际 token 数量（覆盖模拟值）
  can_interrupt?: boolean // 是否允许中断（默认 true）
}

// 示例：
const status1 = { text: 'Analyzing code...' }
const status2 = { tokens: 1234, can_interrupt: false }
const status3 = { text: 'Writing file...', tokens: 567, can_interrupt: true }

============================================================
Props 说明
============================================================

- status: Status | null
  状态对象，包含 text、tokens、can_interrupt
  可选，默认为 null

- onAbort: () => void
  中止按钮点击时的回调函数
  可选，默认为 undefined

- isLoading: boolean
  控制状态栏的显示/隐藏
  必填

- provider: 'claude' | 'cursor' | 'codex'
  AI 提供商（当前未使用，预留）
  可选，默认为 'claude'

============================================================
动画说明
============================================================

1. Spinner 动画：
   - 4 个图标循环显示：✻ ✹ ✸ ✶
   - 每 500ms 切换一次
   - 偶数位置放大并高亮

2. 状态文本动画：
   - 每 3 秒切换动作词
   - 动作词列表：Thinking, Processing, Analyzing, Working, Computing, Reasoning

3. 进入动画：
   - 从底部滑入
   - 持续 300ms

============================================================
响应式设计
============================================================

移动端（< 640px）：
- 隐藏 token 数量
- 隐藏分隔符
- 隐藏 "Stop" 文字（只显示 X 图标）
- 字体大小调整为 text-xs

桌面端（≥ 640px）：
- 显示所有信息
- "Stop" 文字可见
- 字体大小为 text-sm

-->
