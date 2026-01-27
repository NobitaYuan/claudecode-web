/**
 * Vue 3 版本的 createDiff 函数
 *
 * 用于比较两个文本字符串的差异，返回添加和删除的行
 * 包含缓存机制以提高性能
 */

import { DiffLine } from '../../hooks/utils/message'

/**
 * 计算两个字符串的差异
 *
 * @param oldStr - 旧文本
 * @param newStr - 新文本
 * @returns diff 行数组
 *
 * @example
 * ```typescript
 * const oldText = "line1\nline2\nline3"
 * const newText = "line1\nline4\nline3"
 * const diff = calculateDiff(oldText, newText)
 * // [
 * //   { type: 'removed', content: 'line2', lineNum: 2 },
 * //   { type: 'added', content: 'line4', lineNum: 2 }
 * // ]
 * ```
 */
export function calculateDiff(oldStr: string, newStr: string): DiffLine[] {
  // 按行分割
  const oldLines = oldStr.split('\n')
  const newLines = newStr.split('\n')

  // ========================================================
  // 这里是简单的 diff 算法实现
  // ========================================================
  const diffLines: DiffLine[] = []
  let oldIndex = 0
  let newIndex = 0

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex]
    const newLine = newLines[newIndex]

    // ========================================================
    // 分支1：只有新行剩余（添加）
    // ========================================================
    if (oldIndex >= oldLines.length) {
      diffLines.push({
        type: 'added',
        content: newLine || '',
        lineNum: newIndex + 1,
      })
      newIndex++
    }

    // ========================================================
    // 分支2：只有旧行剩余（删除）
    // ========================================================
    else if (newIndex >= newLines.length) {
      diffLines.push({
        type: 'removed',
        content: oldLine || '',
        lineNum: oldIndex + 1,
      })
      oldIndex++
    }

    // ========================================================
    // 分支3：行相同（跳过不显示）
    // ========================================================
    else if (oldLine === newLine) {
      // 行相同 - 在 diff 视图中跳过（或显示为上下文）
      oldIndex++
      newIndex++
    }

    // ========================================================
    // 分支4：行不同（同时显示删除和添加）
    // ========================================================
    else {
      diffLines.push({
        type: 'removed',
        content: oldLine || '',
        lineNum: oldIndex + 1,
      })
      diffLines.push({
        type: 'added',
        content: newLine || '',
        lineNum: newIndex + 1,
      })
      oldIndex++
      newIndex++
    }
  }

  return diffLines
}

/**
 * 创建带缓存的 diff 计算函数
 *
 * 使用 Vue 3 的 computed 实现缓存，避免重复计算相同的 diff
 *
 * @returns 返回一个函数，该函数接收 oldStr 和 newStr，返回 diff 行数组
 *
 * @example
 * ```typescript
 * // 在 setup() 中使用
 * import { useCreateDiff } from './utils/createDiff'
 *
 * const createDiff = useCreateDiff()
 *
 * // 使用
 * const diff = createDiff(oldText, newText)
 * ```
 *
 * @example
 * ```typescript
 * // 在组件中使用
 * <script setup lang="ts">
 * import { useCreateDiff } from './utils/createDiff'
 *
 * const createDiff = useCreateDiff()
 *
 * const diffLines = computed(() =>
 *   createDiff(oldString.value, newString.value)
 * )
 * </script>
 * ```
 */
export function useCreateDiff() {
  // ========================================================
  // 这里是缓存 Map，用于存储已计算的 diff 结果
  // ========================================================
  const cache = ref(new Map<string, DiffLine[]>())

  /**
   * 计算带缓存的 diff
   *
   * 缓存键格式：`${oldStr.length}-${newStr.length}-${oldStr.slice(0, 50)}`
   * - 长度：快速排除明显不同的情况
   * - 前50个字符：区分内容
   *
   * @param oldStr - 旧文本
   * @param newStr - 新文本
   * @returns diff 行数组
   */
  const createDiff = (oldStr: string, newStr: string): DiffLine[] => {
    // ========================================================
    // 这里是缓存键生成逻辑
    // ========================================================
    const key = `${oldStr.length}-${newStr.length}-${oldStr.slice(0, 50)}`

    // ========================================================
    // 分支1：缓存命中，直接返回
    // ========================================================
    if (cache.value.has(key)) {
      return cache.value.get(key)!
    }

    // ========================================================
    // 分支2：缓存未命中，计算 diff
    // ========================================================
    const result = calculateDiff(oldStr, newStr)

    // ========================================================
    // 这里是缓存存储逻辑
    // ========================================================
    cache.value.set(key, result)

    // ========================================================
    // 这里是缓存大小控制（最多保留100个）
    // ========================================================
    if (cache.value.size > 100) {
      const firstKey = cache.value.keys().next().value
      cache.value.delete(firstKey)
    }

    return result
  }

  /**
   * 清除缓存
   *
   * @example
   * ```typescript
   * const { clearCache } = useCreateDiff()
   * clearCache()
   * ```
   */
  const clearCache = () => {
    cache.value.clear()
  }

  /**
   * 获取缓存大小
   *
   * @example
   * ```typescript
   * const { getCacheSize } = useCreateDiff()
   * console.log(getCacheSize()) // 输出缓存中的项数
   * ```
   */
  const getCacheSize = () => {
    return cache.value.size
  }

  return {
    createDiff,
    clearCache,
    getCacheSize,
  }
}

/**
 * ============================================================
 * 完整使用示例
 * ============================================================
 *
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useCreateDiff } from './utils/createDiff'
 * import type { DiffLine } from './utils/createDiff'
 *
 * // 获取 createDiff 函数（带缓存）
 * const { createDiff } = useCreateDiff()
 *
 * // 原始文本
 * const oldText = ref('line1\nline2\nline3')
 * const newText = ref('line1\nline4\nline3')
 *
 * // ========================================================
 * // 这里是计算 diff（带缓存）
 * // ========================================================
 * const diffLines = computed(() => {
 *   return createDiff(oldText.value, newText.value)
 * })
 *
 * // 手动计算（不使用 computed）
 * function updateDiff() {
 *   const diff = createDiff(oldText.value, newText.value)
 *   console.log('Diff:', diff)
 * }
 *
 * // 监听文本变化
 * watch([oldText, newText], () => {
 *   // diffLines 会自动更新（computed）
 *   console.log('Diff 已更新')
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <!-- 显示 diff -->
 *     <div v-for="(line, index) in diffLines" :key="index">
 *       <div
 *         v-if="line.type === 'removed'"
 *         class="bg-red-100 text-red-800"
 *       >
 *         - {{ line.content }}
 *       </div>
 *       <div
 *         v-else
 *         class="bg-green-100 text-green-800"
 *       >
 *         + {{ line.content }}
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * ============================================================
 * 在 MessageComponent 中使用
 * ============================================================
 *
 * ```vue
 * <script setup lang="ts">
 * import { useCreateDiff } from '@/utils/createDiff'
 *
 * const props = defineProps<{
 *   message: Message
 * }>()
 *
 * // 获取 createDiff 函数
 * const { createDiff } = useCreateDiff()
 *
 * // 解析工具输入
 * const parsedEditInput = computed(() => {
 *   if (props.message.toolName !== 'Edit' || !props.message.toolInput) {
 *     return null
 *   }
 *   try {
 *     return JSON.parse(props.message.toolInput)
 *   } catch (e) {
 *     return null
 *   }
 * })
 *
 * // ========================================================
 * // 这里是计算 diff 行（带缓存）
 * // ========================================================
 * const editDiffLines = computed(() => {
 *   if (!parsedEditInput.value) return []
 *   return createDiff(
 *     parsedEditInput.value.old_string,
 *     parsedEditInput.value.new_string
 *   )
 * })
 * </script>
 *
 * <template>
 *   <!-- 这里是 Edit 工具的 diff 显示 -->
 *   <div v-if="message.toolName === 'Edit' && parsedEditInput">
 *     <div v-for="(diffLine, i) in editDiffLines" :key="i" class="flex">
 *       <span
 *         :class="[
 *           'w-8 text-center border-r',
 *           diffLine.type === 'removed'
 *             ? 'bg-red-50 text-red-600 border-red-200'
 *             : 'bg-green-50 text-green-600 border-green-200'
 *         ]"
 *       >
 *         {{ diffLine.type === 'removed' ? '-' : '+' }}
 *       </span>
 *       <span
 *         :class="[
 *           'px-2 py-0.5 flex-1 whitespace-pre-wrap',
 *           diffLine.type === 'removed'
 *             ? 'bg-red-50 text-red-800'
 *             : 'bg-green-50 text-green-800'
 *         ]"
 *       >
 *         {{ diffLine.content }}
 *       </span>
 *     </div>
 *   </div>
 * </template>
 * ```
 */

/**
 * 默认导出：不带 hook 的函数版本
 */
export default function useCreateDiffDefault() {
  return useCreateDiff()
}
