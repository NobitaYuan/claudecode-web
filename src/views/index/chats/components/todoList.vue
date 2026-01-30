<script lang="ts" setup>
import { computed } from 'vue'

interface TodoItem {
  content: string
  activeForm: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface IProps {
  todos: TodoItem[]
}
const Props = withDefaults(defineProps<IProps>(), {
  todos: () => [],
})

// 获取状态图标
const getStatusIcon = (status: TodoItem['status']) => {
  switch (status) {
    case 'completed':
      return '✅'
    case 'in_progress':
      return '🔄'
    case 'pending':
    default:
      return '⏳'
  }
}

// 获取状态文本
const getStatusText = (status: TodoItem['status']) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '进行中'
    case 'pending':
    default:
      return '待处理'
  }
}

// 获取状态颜色类
const getStatusClass = (status: TodoItem['status']) => {
  switch (status) {
    case 'completed':
      return 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
    case 'in_progress':
      return 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
    case 'pending':
    default:
      return 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
  }
}

// 统计信息
const stats = computed(() => {
  const total = Props.todos.length
  const completed = Props.todos.filter((t: TodoItem) => t.status === 'completed').length
  const inProgress = Props.todos.filter((t: TodoItem) => t.status === 'in_progress').length
  const pending = Props.todos.filter((t: TodoItem) => t.status === 'pending').length

  return { total, completed, inProgress, pending }
})
</script>

<template>
  <div class="todoList border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
    <!-- 标题和统计 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-base">任务列表</h4>
      </div>

      <!-- 统计徽章 -->
      <div class="flex gap-2 text-xs">
        <span v-if="stats.pending > 0" class="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          ⏳ {{ stats.pending }}
        </span>
        <span v-if="stats.inProgress > 0" class="px-2 py-1 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
          🔄 {{ stats.inProgress }}
        </span>
        <span v-if="stats.completed > 0" class="px-2 py-1 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300">
          ✅ {{ stats.completed }}
        </span>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="mb-4">
      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
        <span>完成进度</span>
        <span>{{ Math.round((stats.completed / stats.total) * 100) || 0 }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
          :style="{ width: `${(stats.completed / stats.total) * 100 || 0}%` }"
        ></div>
      </div>
    </div>

    <!-- 待办事项列表 -->
    <div class="space-y-2">
      <div
        v-for="(todo, index) in Props.todos"
        :key="index"
        :class="['flex items-start gap-3 p-3 rounded-lg border-2 transition-all', getStatusClass(todo.status)]"
      >
        <!-- 状态图标 -->
        <div class="flex-shrink-0 mt-0.5">
          <span class="text-xl">{{ getStatusIcon(todo.status) }}</span>
        </div>

        <!-- 任务内容 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <p
              :class="[
                'font-medium text-sm',
                todo.status === 'completed' ? 'text-gray-600 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100',
              ]"
            >
              {{ todo.content }}
            </p>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded',
                todo.status === 'completed' && 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300',
                todo.status === 'in_progress' && 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300',
                todo.status === 'pending' && 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
              ]"
            >
              {{ getStatusText(todo.status) }}
            </span>
          </div>

          <!-- 进行中时显示活动形式 -->
          <p v-if="todo.status === 'in_progress' && todo.activeForm !== todo.content" class="text-xs text-blue-600 dark:text-blue-400">
            正在: {{ todo.activeForm }}
          </p>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="Props.todos.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p class="text-sm">暂无任务</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.todoList {
  // 添加动画效果
  .transition-all {
    transition: all 0.3s ease;
  }

  // 进度条动画
  .bg-gradient-to-r {
    transition: width 0.5s ease-in-out;
  }

  // 列表项悬停效果
  .space-y-2 > div:hover {
    transform: translateX(4px);
  }
}
</style>
