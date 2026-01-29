import { useChat } from './useChat'
import { LoadingProgressMessage, ProjectsUpdatedMessage, useWebSocket } from './useWebSocket'

/**
 * useWebSocketMessageHandler Composable
 *
 * 功能：
 * - 处理 loading_progress 消息（显示/清除加载进度）
 * - 处理 projects_updated 消息（更新项目状态）
 *
 * @param params - 参数对象
 * @returns WebSocket 消息处理状态和方法
 */
export function useWebSocketMessageHandler() {
  const { wsMessages, loadingProgress, loadingProgressTimeout } = useWebSocket()

  const { projects, selectedProject, selectedSession, getMessages } = useChat()

  // ============================================================
  // 处理加载进度消息
  // （从原代码 182-195 行转换）
  // ============================================================
  const handleLoadingProgress = (latestMessage: LoadingProgressMessage) => {
    // ========================================================
    // 清除现有定时器
    // ========================================================
    if (loadingProgressTimeout.value) {
      clearTimeout(loadingProgressTimeout.value)
      loadingProgressTimeout.value = null
    }

    // ========================================================
    // 设置加载进度
    // ========================================================
    loadingProgress.value = latestMessage

    // ========================================================
    // 分支: 如果 phase 为 'complete'，500ms 后清除
    // ========================================================
    if (latestMessage.phase === 'complete') {
      loadingProgressTimeout.value = window.setTimeout(() => {
        loadingProgress.value = null
        loadingProgressTimeout.value = null
      }, 500)
    }
  }

  // ============================================================
  // 处理项目更新
  // ============================================================
  const handleProjectsUpdate = (latestMessage: ProjectsUpdatedMessage) => {
    if (latestMessage.changedFile && selectedSession.value && selectedProject.value) {
      // Extract session ID from changedFile (format: "project-name/session-id.jsonl")
      const normalized = latestMessage.changedFile.replace(/\\/g, '/')
      const changedFileParts = normalized.split('/')

      if (changedFileParts.length >= 2) {
        const filename = changedFileParts[changedFileParts.length - 1]
        const changedSessionId = filename.replace('.jsonl', '')

        // Check if this is the currently-selected session
        if (changedSessionId === selectedSession.value.id) {
          // 更新消息
          getMessages()
        }
      }
    }

    // ========================================================
    // 用 WebSocket 的新数据更新项目状态
    // ========================================================
    const updatedProjects = latestMessage.projects
    // 更新左侧项目信息
    projects.value = updatedProjects

    // ========================================================
    // 如果更新的项目中存在当前选中的项目，则更新它
    // ========================================================
    if (!selectedProject.value) return
    const updatedSelectedProject = updatedProjects.find((p) => p.name === selectedProject.value.name)

    if (!updatedSelectedProject) return
    // 只有在项目实际发生变化时才更新 - 防止闪烁
    if (JSON.stringify(updatedSelectedProject) !== JSON.stringify(selectedProject.value)) {
      // 更新选中的项目
      selectedProject.value = updatedSelectedProject
    }
  }

  // ============================================================
  // 主监听器：监听 messages 变化
  // ============================================================
  watch(
    wsMessages,
    (newMessages) => {
      if (!newMessages?.length) return
      const latestMessage = newMessages[newMessages.length - 1]
      // ========================================================
      // 分支1: 处理加载进度消息
      // ========================================================
      if (latestMessage.type === 'loading_progress') {
        handleLoadingProgress(latestMessage as LoadingProgressMessage)
        return
      }
      // ========================================================
      // 分支2: 处理项目更新消息
      // ========================================================
      if (latestMessage.type === 'projects_updated') {
        handleProjectsUpdate(latestMessage as ProjectsUpdatedMessage)
      }
    },
    { deep: true },
  )

  // ============================================================
  // 清理函数（对应 useEffect 的 return 清理）
  // ============================================================
  onUnmounted(() => {
    if (loadingProgressTimeout.value) {
      clearTimeout(loadingProgressTimeout.value)
    }
  })
}
