<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Message } from '../../hooks/utils/message'
import toolResult from './toolResult.vue'

interface IProps {
  message: Message
}
const Props = withDefaults(defineProps<IProps>(), {})

// 交互式的提问
const interactivePromptQuestion = computed(() => {
  if (!Props.message.isInteractivePrompt) return []
  try {
    const parsed = JSON.parse(Props.message.toolInput)
    // 支持两种格式：直接是数组，或者包含questions字段
    return Array.isArray(parsed) ? parsed : parsed.questions || []
  } catch (e) {
    console.error('Failed to parse toolInput:', e)
    return []
  }
})

// 当前选中的tab索引
const activeTabIndex = ref(0)

// 当前显示的问题
const currentQuestion = computed(() => {
  return interactivePromptQuestion.value[activeTabIndex.value] || {}
})

// 选中选项的状态（存储每个问题选中的选项索引）
const selectedOptions = ref<Record<number, number[]>>({})

// 初始化选中状态（从已有答案中恢复）
const initSelectedOptions = () => {
  if (Props.message.toolResult) {
    try {
      const result = Props.message.toolResult.content

      // 正则表达式
      const regex = /"([^"]+？)"="([^"]+)"/g

      // 提取所有问答对
      const matches = [...result.matchAll(regex)]

      // 转换为对象
      const answers = Object.fromEntries(matches.map(([, question, answer]) => [question, answer]))

      // console.log('match', matches, answers, interactivePromptQuestion.value)

      // 根据答案恢复选中状态
      interactivePromptQuestion.value.forEach((q: any, questionIndex: number) => {
        const questionText = q.question || q.header
        const answer = answers[questionText]

        if (answer) {
          // 在选项中找到匹配的选项索引
          const matchedIndices: number[] = []

          q.options?.forEach((option: any, optionIndex: number) => {
            const optionLabel = option.label || option.text

            // 支持多选答案（逗号分隔）
            const answerArray = answer.split(',').map((a: string) => a.trim())

            if (answerArray.includes(optionLabel)) {
              matchedIndices.push(optionIndex)
            }
          })

          // 设置选中的选项索引
          if (matchedIndices.length > 0) {
            selectedOptions.value[questionIndex] = matchedIndices
          }
        }
      })
    } catch (e) {
      console.error('Failed to parse toolResult:', e)
    }
  }
}

// 监听消息变化，初始化选中状态
watch(
  () => Props.message.toolResult,
  () => {
    initSelectedOptions()
  },
  { immediate: true },
)

// 处理选项点击
const handleOptionClick = (optionIndex: number | string) => {
  // 如果已经result了，就不允许再选了
  if (hasResult.value) return
  const index = typeof optionIndex === 'string' ? parseInt(optionIndex, 10) : optionIndex
  const questionIndex = activeTabIndex.value
  const multiSelect = currentQuestion.value.multiSelect

  if (multiSelect) {
    // 多选模式
    if (!selectedOptions.value[questionIndex]) {
      selectedOptions.value[questionIndex] = []
    }
    const currentSelected = selectedOptions.value[questionIndex]
    const idx = currentSelected.indexOf(index)

    if (idx > -1) {
      // 已选中，取消选中
      currentSelected.splice(idx, 1)
    } else {
      // 未选中，添加选中
      currentSelected.push(index)
    }
  } else {
    // 单选模式
    selectedOptions.value[questionIndex] = [index]
  }
}

// 判断选项是否被选中
const isOptionSelected = (optionIndex: number | string) => {
  const index = typeof optionIndex === 'string' ? parseInt(optionIndex, 10) : optionIndex
  const questionIndex = activeTabIndex.value
  return selectedOptions.value[questionIndex]?.includes(index) || false
}

// 判断是否已完成选择
const hasAnswer = computed(() => {
  const questionIndex = activeTabIndex.value
  const selected = selectedOptions.value[questionIndex]
  return selected && selected.length > 0
})

// 是否有答案了
const hasResult = computed(() => {
  return Props.message?.toolResult
})
</script>

<template>
  <div class="questionSelecter bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
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
        <h4 class="font-semibold text-amber-900 dark:text-amber-100 text-base mb-3">交互提示</h4>

        <!-- Tab 切换栏 (当有多个问题时显示) -->
        <div v-if="interactivePromptQuestion.length > 1" class="mb-4">
          <div class="flex flex-wrap gap-2 border-b border-amber-300 dark:border-amber-700 pb-2">
            <!-- @vue-ignore -->
            <button
              v-for="(question, index) in interactivePromptQuestion"
              :key="index"
              @click="activeTabIndex = index"
              :class="[
                'px-4 py-2 rounded-t-lg text-sm font-medium transition-all',
                activeTabIndex === index
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/50',
              ]"
            >
              {{ question.header }}
            </button>
          </div>
        </div>

        <!-- 当前问题文本 -->
        <div class="mb-3">
          <p v-if="currentQuestion.question" class="text-amber-900 dark:text-amber-100 font-medium text-base">
            {{ currentQuestion.question }}
            <span v-if="currentQuestion.multiSelect" class="text-sm">（多选）</span>
          </p>
          <p v-else class="text-amber-800 dark:text-amber-200 text-sm">请从以下选项中选择：</p>
        </div>

        <!-- 选项按钮列表 -->
        <div class="space-y-3 mb-4">
          <div
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            @click="handleOptionClick(index)"
            :class="[
              'p-4 rounded-lg border-2 transition-all ',
              isOptionSelected(index)
                ? 'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 dark:border-amber-600 shadow-md'
                : 'bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600',
              hasResult ? 'pointer-events-none' : 'cursor-pointer',
            ]"
          >
            <div class="flex items-start gap-3">
              <!-- 选项指示器 (单选圆圈 / 多选方块) -->
              <div class="flex-shrink-0 mt-0.5">
                <div
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center',
                    isOptionSelected(index) ? 'border-white bg-white/20' : 'border-current',
                  ]"
                >
                  <svg v-if="isOptionSelected(index)" class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <!-- 选项内容 -->
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-base mb-1">
                  {{ option.label }}
                </div>
                <div v-if="option.description" class="text-sm opacity-90">
                  {{ option.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 等待提示 -->
        <div v-if="!hasResult" class="bg-amber-100 dark:bg-amber-800/30 rounded-lg p-3">
          <p class="text-amber-900 dark:text-amber-100 text-sm font-medium mb-1">⏳ Claude正在等待您的响应</p>
          <p class="text-amber-800 dark:text-amber-200 text-xs">
            {{ hasAnswer ? '已选择选项，准备提交' : '请选择一个或多个选项' }}
          </p>
          <!-- 提交 -->
        </div>
        <toolResult v-else :message="message" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.questionSelecter {
}
</style>
