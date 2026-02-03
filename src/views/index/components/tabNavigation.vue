<script setup lang="ts">
import { TabKeyType } from '../types'

// ============ 类型定义 ============
/** 标签项类型 */
interface ITabItem {
  /** 标签唯一标识 */
  key: TabKeyType
  /** 显示文字 */
  label: string
  /** SVG 图标路径 */
  svg: string
  /** 是否显示（可选） */
  show?: boolean
}
const activeTab = defineModel<TabKeyType>('modelValue', { default: 'shell' })
// ============ 标签配置 ============
/** 计算属性：动态生成标签数组 */
const tabs = computed<ITabItem[]>(() => [
  {
    key: 'chat', // 标签唯一标识
    label: '对话', // 显示文字
    // SVG 图标路径（气泡图标）
    svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />',
  },
  {
    key: 'shell', // 终端标签
    label: '终端',
    // SVG 图标路径（终端图标）
    svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />',
  },
  {
    key: 'files', // 文件标签
    label: '文件',
    // SVG 图标路径（文件夹图标）
    svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />',
  },
  // {
  //   key: 'git', // Git 标签
  //   label: 'Git',
  //   // SVG 图标路径（闪电图标，表示 Git 操作）
  //   svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />',
  // },
]) // 过滤掉 show 为 false 的标签
</script>

<template>
  <!-- 现代化标签导航栏 - 右侧显示 -->
  <div class="flex-shrink-0 hidden sm:block">
    <!-- 标签容器：灰色背景，圆角，内边距 -->
    <div class="relative flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <!-- 遍历渲染每个标签按钮 -->
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200',
          activeTab === tab.key
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' // 选中状态：白色背景，阴影
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700', // 未选中状态：灰色文字，悬停变色
        ]"
      >
        <!-- 标签内容：图标 + 文字 -->
        <span class="flex items-center gap-1 sm:gap-1.5">
          <!-- SVG 图标：使用 v-html 动态注入 SVG 路径 -->
          <svg class="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="tab.svg"></svg>
          <!-- 标签文字：仅在大屏幕（lg+）显示 -->
          <span class="hidden md:hidden lg:inline">{{ tab.label }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
