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

// 处理 Edit 文件打开
async function handleEditFileOpen(filePath: string) {
  if (!props.onFileOpen) return
  props.onFileOpen(filePath)
}
</script>

<template>
  <div class="linesDiff">
    <div class="bg-white dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 rounded-lg overflow-hidden shadow-sm">
      <div
        class="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/80 dark:to-gray-800/40 border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm"
      >
        <button
          @click="handleEditFileOpen(parsedEditInput.file_path)"
          class="text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate cursor-pointer font-medium transition-colors"
        >
          {{ parsedEditInput?.file_path }}
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
  </div>
</template>

<style lang="scss" scoped>
.linesDiff {
}
</style>
