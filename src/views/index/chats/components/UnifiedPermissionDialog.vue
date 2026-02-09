<script lang="ts" setup>
import { computed } from 'vue'
import { usePermissionTool } from '../hooks/usePermissionTool'

const emit = defineEmits(['sendAnswer'])
const { pendingRequests, sendAnswer } = usePermissionTool(emit)

// 权限类型配置
const permissionConfigs = {
  Bash: {
    title: '终端执行：',
    getContent: (input: any) => input.command,
  },
  ExitPlanMode: {
    title: '📄计划批准：',
    getContent: (input: any) => input.plan,
  },
  Edit: {
    title: '文件编辑：',
    getContent: (input: any) => input.new_string,
  },
  Write: {
    title: '文件写入：',
    getContent: (input: any) => input.content,
  },
} as const

// 除AskUserQuestion以外的
const simpleRequests = computed(() => {
  return pendingRequests.value.filter((request) => request.toolName !== 'AskUserQuestion')
})

// 辅助函数：获取请求对应的配置
const getRequestConfig = (toolName: string) => {
  // 优先返回配置对象
  const config = permissionConfigs[toolName as keyof typeof permissionConfigs]
  if (config) return config

  // 保底返回：如果工具类型未知，返回一个通用配置
  return {
    title: `权限请求 (${toolName})`,
    getContent: (input: any) => {
      // 尝试智能提取内容
      if (input.command) return input.command
      if (input.plan) return input.plan
      if (input.new_string) return input.new_string
      if (input.content) return input.content
      if (input.file_path) return input.file_path
      return JSON.stringify(input, null, 2) || '···'
    },
  }
}
</script>

<template>
  <div class="unified-permission-container">
    <!-- 堆叠显示所有待处理请求 -->
    <div
      v-for="(request, index) in simpleRequests"
      :key="request.requestId"
      class="permissionDialog bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
      :style="{ marginTop: index === 0 ? '0' : '0.75rem' }"
    >
      <!-- 标题 -->
      <div class="text-base mb-2 font-semibold text-amber-900 dark:text-amber-100">
        {{ getRequestConfig(request.toolName)?.title }}
      </div>

      <!-- 文件路径（如果需要）-->
      <p v-if="getRequestConfig(request.toolName) && request.input?.file_path" class="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {{ request.input.file_path }}
      </p>

      <!-- 内容区域 -->
      <div class="md flex-1 overflow-auto text-sm text-amber-900 dark:text-amber-100">
        {{ getRequestConfig(request.toolName)?.getContent(request.input) }}
      </div>

      <!-- 操作按钮 -->
      <div class="mt-3 flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          @click="sendAnswer(request.requestId, true)"
          class="inline-flex items-center gap-2 rounded-md bg-amber-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-amber-700 transition-colors"
        >
          同意
        </button>

        <button
          type="button"
          @click="sendAnswer(request.requestId, false)"
          class="inline-flex items-center gap-2 rounded-md text-xs font-medium px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/30 transition-colors"
        >
          拒绝
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.unified-permission-container {
  position: absolute;
  width: 100%;
  left: 0;
  top: 0;
  transform: translateY(-100%);
  overflow: auto;
  max-height: 60vh;
  padding: 12px 36px 12px 12px;
}

.permissionDialog {
  position: relative;
  max-height: 50vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 20px rgba(0, 0, 0, 0.1);
  padding: 24px;

  .md {
    flex: 1;
    overflow: auto;
  }
}
</style>
