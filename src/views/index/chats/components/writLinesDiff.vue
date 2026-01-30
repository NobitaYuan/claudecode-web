<script lang="ts" setup>
import { DiffLine, Message, ToolUseMessage } from '../../hooks/utils/message'

interface IProps {
  message: Message
  /** 创建 diff 的函数 */
  createDiff?: (oldString: string, newString: string) => DiffLine[]
  /** 打开文件的回调 */
  onFileOpen?: (filePath: string, diffData?: { old_string: string; new_string: string }) => void
}
const props = withDefaults(defineProps<IProps>(), {})

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

// 处理 Write 文件打开
async function handleWriteFileOpen(filePath: string) {
  if (!props.onFileOpen) return
  props.onFileOpen(filePath, {
    old_string: '',
    new_string: parsedWriteInput.value?.content || '',
  })
}
</script>

<template>
  <div class="linesDiff">
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
        新文件
      </span>
    </div>
    <!-- Diff 显示 -->
    <div class="text-xs font-mono">
      <div v-for="(diffLine, i) in writeDiffLines" :key="i" class="flex">
        <span
          :class="[
            'w-8 text-center border-r select-none',
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
</template>

<style lang="scss" scoped>
.linesDiff {
}
</style>
