import { claudePermissionCancel, claudePermissionRequest } from './useWebSocket'

const claudePermissionMap = ref<Map<string, claudePermissionRequest>>(new Map())
const addPermissionMap = (data: claudePermissionRequest) => {
  claudePermissionMap.value.set(data.requestId, { ...data, isCancel: false })
}

const cancelPermission = (data: claudePermissionRequest | claudePermissionCancel) => {
  if (claudePermissionMap.value.has(data.requestId)) {
    const item = claudePermissionMap.value.get(data.requestId)
    item.isCancel = true
  }
}

const cancelAllPermission = () => {
  claudePermissionMap.value.clear()
}

// 这里用于存储Claude的权限请求，比如说，问用户问题什么的
export const useClaudePermission = () => {
  return {
    claudePermissionMap,
    addPermissionMap,
    cancelPermission,
    cancelAllPermission,
  }
}
