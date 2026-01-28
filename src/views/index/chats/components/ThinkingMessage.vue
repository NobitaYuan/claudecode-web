<script setup lang="ts">
import ClaudeLogo from './ClaudeLogo.vue'
</script>
<template>
  <!-- ============================================================ -->
  <!-- 分支: 消息类型为 'assistant' 且正在思考 -->
  <!-- ============================================================ -->
  <div class="chat-message assistant">
    <div class="w-full">
      <!-- ============================================================ -->
      <!-- 消息头部：AI Logo + 名称 -->
      <!-- ============================================================ -->
      <div class="flex items-center space-x-3 mb-2">
        <!-- Logo 容器 -->
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 p-1 bg-transparent">
          <!-- 占位符：Claude Logo 组件 -->
          <ClaudeLogo class="w-full h-full" />
          <!-- 如果需要支持其他 provider，可以在这里添加 v-else-if -->
        </div>

        <!-- Provider 名称 -->
        <div class="text-sm font-medium text-gray-900 dark:text-white">Claude</div>
      </div>

      <!-- ============================================================ -->
      <!-- 思考中状态指示器 -->
      <!-- ============================================================ -->
      <div class="w-full text-sm text-gray-500 dark:text-gray-400 pl-3 sm:pl-0">
        <div class="flex items-center space-x-1">
          <!-- 三个跳动的点，带有不同的延迟 -->
          <div class="animate-pulse">●</div>
          <div class="animate-pulse" style="animation-delay: 0.2s">●</div>
          <div class="animate-pulse" style="animation-delay: 0.4s">●</div>
          <span class="ml-2">思考中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================ */
/* Tailwind CSS 类说明（如果项目使用 Tailwind）              */
/* ============================================================ */
/*
- chat-message assistant: 消息容器的类名
- w-full: 宽度 100%
- flex items-center: flex 布局，垂直居中
- space-x-3: 子元素之间水平间距 0.75rem
- mb-2: 底部边距 0.5rem
- w-8 h-8: 宽高 2rem (32px)
- rounded-full: 圆角
- text-sm: 小号文字
- flex-shrink-0: 不允许缩小
- text-gray-900 / dark:text-white: 深色/浅色模式下的文字颜色
- animate-pulse: 脉冲动画
*/
</style>
