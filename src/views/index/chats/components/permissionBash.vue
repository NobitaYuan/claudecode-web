<script lang="ts" setup>
import { useClaudePermission } from '../../hooks/useClaudePermission'
import { claudePermissionRequest } from '../../hooks/useWebSocket'
import { MessageResponse } from '@/components/ai-elements/message'
const emit = defineEmits(['sendAnswer'])

const { claudePermissionMap, cancelPermission } = useClaudePermission()

/*
{
    "type": "claude-permission-request",
    "requestId": "15754b73-79f3-4985-9a28-5a02cadac448",
    "toolName": "Bash",
    "input": {
        "command": "cat /proc/version 2>/dev/null || systeminfo | findstr /C:\"OS\"",
        "description": "Check OS version"
    },
    "sessionId": "b8b2b65d-a034-4c20-b5de-6cda3e3d8ed7"
}
*/
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
    if (item.toolName === 'Bash' && item.input.command) {
      has = true
    }
  })
  return has
})

// 当前的请求
const curRequest = computed(() => {
  if (!hasQuestion.value) return null
  let q: claudePermissionRequest
  claudePermissionMap.value.forEach((item) => {
    if (item.toolName === 'Bash') {
      q = item
    }
  })
  return q
})

const sendAnswer = (allow: boolean = true) => {
  emit('sendAnswer', {
    type: 'claude-permission-response',
    requestId: curRequest.value.requestId,
    allow,
    updatedInput: '同意执行', // 传递用户选择的答案
    // message: '',// 拒绝时的原因
    // rememberEntry: ''  // 可选，记住这次选择的权限条目
  })
  cancelPermission(curRequest.value)
}
</script>

<template>
  <div class="permissionDecision bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" v-if="curRequest">
    <div class="text-[26px] mb-[12px]">终端执行：</div>
    <div class="md">
      <MessageResponse :content="curRequest?.input?.command || '?'"> </MessageResponse>
    </div>
    <div class="mt-3 flex flex-wrap gap-2 justify-end">
      <button
        type="button"
        @click="sendAnswer(true)"
        class="inline-flex items-center gap-2 rounded-md bg-amber-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-amber-700 transition-colors"
      >
        同意
      </button>

      <button
        type="button"
        @click="sendAnswer(false)"
        class="inline-flex items-center gap-2 rounded-md text-xs font-medium px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/30 transition-colors"
      >
        拒绝
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.permissionDecision {
  position: absolute;
  width: 100%;
  max-height: 50vh;
  overflow: hidden;
  left: 0;
  top: 0;
  transform: translateY(-100%);
  display: flex;
  flex-direction: column;
  .md {
    flex: 1;
    overflow: auto;
  }
}
</style>
