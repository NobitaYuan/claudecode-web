<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useClaudePermission } from '../../hooks/useClaudePermission'
import { claudePermissionRequest } from '../../hooks/useWebSocket'

/* 
{
    "type": "claude-permission-request",
    "requestId": "aab36619-fb81-4df8-b5c1-8cda74c0085a",
    "toolName": "AskUserQuestion",
    "input": {
        "questions": [
            {
                "question": "是否需要以下高级功能？",
                "header": "高级功能",
                "options": [
                    {
                        "label": "搜索功能",
                        "description": "搜索待办事项（按标题、标签等）"
                    },
                    {
                        "label": "排序功能",
                        "description": "按创建时间、优先级、截止日期排序"
                    },
                    {
                        "label": "子任务",
                        "description": "子任务支持，一个待办可包含多个子任务"
                    },
                    {
                        "label": "暂不需要",
                        "description": "先做简单版本，后续迭代"
                    }
                ],
                "multiSelect": true
            }
        ]
    },
    "sessionId": "436921d3-c214-456c-86b0-900108d371e2"
}
*/
const emit = defineEmits(['sendAnswer'])

const { claudePermissionMap, cancelPermission } = useClaudePermission()

// 是否有提问
const hasQuestion = computed(() => {
  let has = false
  if (!claudePermissionMap.value.size) return false
  claudePermissionMap.value.forEach((item) => {
    // 没被取消
    if (item.isCancel) {
      has = false
      return
    }
    // 并且是问题
    if (item.toolName === 'AskUserQuestion') {
      has = true
    }
  })
  return has
})

// 交互式的提问
const questions = computed(() => {
  if (!hasQuestion.value) return []
  let q
  claudePermissionMap.value.forEach((item) => {
    if (item.toolName === 'AskUserQuestion') {
      q = item.input.questions || []
    }
  })
  return q
})

// 当前的请求
const curRequest = computed(() => {
  if (!hasQuestion.value) return null
  let q: claudePermissionRequest
  claudePermissionMap.value.forEach((item) => {
    if (item.toolName === 'AskUserQuestion') {
      q = item
    }
  })
  return q
})

const sendAnswer = (allow: boolean = true) => {
  emit('sendAnswer', {
    type: 'claude-permission-response',
    requestId: curRequest.value.requestId,
    allow: allow ? 'allow' : 'deny',
    updatedInput: collectUserAnswers(), // 传递用户选择的答案
    // message: '',// 拒绝时的原因
    // rememberEntry: ''  // 可选，记住这次选择的权限条目
  })
  cancelPermission(curRequest.value)
}

const handleReject = () => {
  sendAnswer(false)
}

// 当前选中的tab索引
const activeTabIndex = ref(0)

// 当前显示的问题
const currentQuestion = computed(() => {
  return questions.value[activeTabIndex.value] || {}
})

// 选中选项的状态（存储每个问题选中的选项索引）
const selectedOptions = ref<Record<number, number[]>>({})

// 处理选项点击
const handleOptionClick = (optionIndex: number | string) => {
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

// 收集所有用户选择的答案
const collectUserAnswers = () => {
  const answers: Record<string, string[]> = {}

  questions.value.forEach((q, questionIndex) => {
    const selectedIndices = selectedOptions.value[questionIndex]
    if (selectedIndices && selectedIndices.length > 0) {
      // 使用问题的 header 作为 key，如果没有 header 则使用索引
      const key = q.header || `question_${questionIndex}`
      // 将选中的选项索引转换为选项的 label
      answers[key] = selectedIndices.map((optionIndex) => {
        return q.options[optionIndex]?.label || ''
      })
    }
  })

  return answers
}

watch(hasQuestion, (val) => {
  if (val) {
    selectedOptions.value = {}
  }
})
</script>

<template>
  <div v-if="hasQuestion" class="questionSelecterDialog bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
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
        <div v-if="questions.length > 1" class="mb-4">
          <div class="flex flex-wrap gap-2 border-b border-amber-300 dark:border-amber-700 pb-2">
            <!-- @vue-ignore -->
            <button
              v-for="(question, index) in questions"
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
              'p-4 rounded-lg border-2 transition-all cursor-pointer',
              isOptionSelected(index)
                ? 'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 dark:border-amber-600 shadow-md'
                : 'bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600',
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

        <!-- 提交和拒绝按钮 -->
        <div class="flex gap-3 mt-4 pt-4 border-t border-amber-300 dark:border-amber-700">
          <button
            @click="sendAnswer(true)"
            class="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            提交
          </button>
          <button
            @click="handleReject"
            class="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.questionSelecterDialog {
  position: absolute;
  width: 100%;
  left: 0;
  top: 0;
  transform: translateY(-100%);
}
</style>
