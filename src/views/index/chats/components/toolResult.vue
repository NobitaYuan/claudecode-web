<script lang="ts" setup>
import { Message } from '../../hooks/utils/message'

interface IProps {
  message: Message
  open?: boolean
}
withDefaults(defineProps<IProps>(), {
  open: false,
})
</script>

<template>
  <div class="toolResult">
    <div
      :id="`tool-result-${message.toolId}`"
      :class="[
        'relative mt-4 px-2 rounded-lg border backdrop-blur-sm scroll-mt-4',
        message.toolResult.isError
          ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200/60 dark:border-red-800/60'
          : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/60 dark:border-green-800/60',
      ]"
    >
      <details class="my-3" :open="open">
        <summary class="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
          <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <!-- 结果头部 -->
          <div class="relative flex items-center gap-2.5 my-3">
            <div
              :class="[
                'w-5 h-5 rounded-md flex items-center justify-center shadow-md',
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
            <span :class="['text-sm font-semibold', message.toolResult.isError ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200']">
              {{ message.toolResult.isError ? '工具调用失败' : '工具调用结果' }}
            </span>
          </div>
        </summary>
        <!-- 结果内容 -->
        <div :class="['relative text-sm', message.toolResult.isError ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100']">
          <!-- TODO: 这里的工具结果渲染逻辑比较复杂，需要处理多种特殊情况 -->
          <!-- 例如：TodoList 结果、Grep/Glob 结果、交互式提示结果等 -->
          {{ message?.toolResult?.content }}
        </div>
      </details>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.toolResult {
}
</style>
