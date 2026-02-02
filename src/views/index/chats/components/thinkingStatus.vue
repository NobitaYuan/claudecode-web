<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ClaudeLogo from './ClaudeLogo.vue'

const spinners = ['✻', '✹', '✸', '✶']
const actionWords = ['思考中', '处理中', '分析中', '工作中', '计算中', '推理中']

// 当前显示的索引
const currentSpinnerIndex = ref(0)
const currentActionIndex = ref(0)

// 切换间隔时间（毫秒）
const SPINNER_INTERVAL = 500 // spinner 切换间隔
const ACTION_INTERVAL = 5000 // action word 切换间隔

let spinnerTimer: number | null = null
let actionTimer: number | null = null

/**
 * 启动自动切换
 * 使用两个独立的定时器分别切换 spinner 和 action word
 */
const startAutoRotation = () => {
  // Spinner 切换定时器（每 500ms 切换一次）
  spinnerTimer = window.setInterval(() => {
    currentSpinnerIndex.value = (currentSpinnerIndex.value + 1) % spinners.length
  }, SPINNER_INTERVAL)

  // Action word 切换定时器（每 2000ms 切换一次）
  actionTimer = window.setInterval(() => {
    currentActionIndex.value = (currentActionIndex.value + 1) % actionWords.length
  }, ACTION_INTERVAL)
}

/**
 * 停止自动切换并清理定时器
 */
const stopAutoRotation = () => {
  if (spinnerTimer !== null) {
    clearInterval(spinnerTimer)
    spinnerTimer = null
  }
  if (actionTimer !== null) {
    clearInterval(actionTimer)
    actionTimer = null
  }
}

// 组件挂载时启动自动切换
onMounted(() => {
  startAutoRotation()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRotation()
})
</script>
<template>
  <div class="chat-message assistant">
    <div class="w-full flex gap-2 items-center">
      <!-- 消息头部：AI Logo + 名称 -->
      <div class="flex items-center space-x-3">
        <!-- Logo 容器 -->
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 p-1 bg-transparent">
          <!-- 占位符：Claude Logo 组件 -->
          <ClaudeLogo class="w-full h-full" />
          <!-- 如果需要支持其他 provider，可以在这里添加 v-else-if -->
          <span class="text-lg text-gray-500 dark:text-gray-400 pl-3">{{ spinners[currentSpinnerIndex] }}</span>
        </div>
      </div>

      <!-- 状态指示器 -->
      <div class="w-full text-sm sm:pl-0">
        <!-- 动态切换的 spinner 图标 -->
        <!-- 动态切换的动作文字 -->
        <div class="flex gap-2 text-sm text-gray-500 dark:text-gray-400 pl-3 sm:pl-0">
          <div>{{ actionWords[currentActionIndex] }}</div>
          <div class="flex items-end space-x-1">
            <!-- 三个跳动的点，带有不同的延迟 -->
            <div class="animate-pulse text-[10px] leading-[15px]">●</div>
            <div class="animate-pulse text-[10px] leading-[15px]" style="animation-delay: 0.2s">●</div>
            <div class="animate-pulse text-[10px] leading-[15px]" style="animation-delay: 0.4s">●</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
