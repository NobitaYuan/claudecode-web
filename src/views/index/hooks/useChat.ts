import { api } from '@/api/api'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { Project, Session } from '../types'
import { Message, RawSessionMessage } from './utils/message'
import { convertSessionMessages } from './utils/messageConverter'

// ============================项目列表================================
const projects = ref<Project[]>([])
const projectLoading = ref(false)
const searchValue = ref('')
const sortBy = ref<'recent' | 'name' | 'default'>('recent')
// 过滤后的项目列表
const filteredProjects = computed(() => {
  let result = projects.value

  // 搜索过滤
  if (searchValue.value) {
    const keyword = searchValue.value.toLowerCase()
    result = result.filter((project) => {
      const matchProject =
        project.displayName?.toLowerCase().includes(keyword) || project.name?.toLowerCase().includes(keyword) || project.path?.toLowerCase().includes(keyword)

      const matchSessions = project.sessions?.some((session) => session.summary?.toLowerCase().includes(keyword))

      return matchProject || matchSessions
    })
  }

  // 排序
  if (sortBy.value === 'recent') {
    result = [...result].sort((a, b) => {
      const aTime = a.sessions?.[0]?.lastActivity ? new Date(a.sessions[0].lastActivity).getTime() : 0
      const bTime = b.sessions?.[0]?.lastActivity ? new Date(b.sessions[0].lastActivity).getTime() : 0
      return bTime - aTime
    })
  } else if (sortBy.value === 'name') {
    result = [...result].sort((a, b) => {
      return (a.displayName || a.name).localeCompare(b.displayName || b.name)
    })
  }

  return result
})
// 获取项目列表
const getProjects = async () => {
  projectLoading.value = true
  try {
    const res = await api.projects()
    if (!res.ok) {
      return MessagePlugin.error(res.statusText)
    }
    const data = await res.json()
    projects.value = Array.isArray(data) ? data : []
    console.log('projects.value', projects.value)
  } catch (error) {
    MessagePlugin.error('获取项目列表失败')
    console.error(error)
  } finally {
    projectLoading.value = false
  }
}
// 删除项目
const delProject = async (project: Project) => {
  const incetance = DialogPlugin.confirm({
    header: '提示',
    body: `确认永久删除「${project.displayName}」项目工作区？`,
    onConfirm: async () => {
      try {
        projectLoading.value = true
        await api.deleteProject(project.name, true)
        incetance.destroy()
        // 如果删除的项目中有当前的会话，则清理会话
        if (project.sessions.find((s) => s.id === selectedSession.value?.id)) {
          clearSessionData()
        }
        await getProjects()
      } finally {
        projectLoading.value = false
      }
    },
  })
}

// ============================对话列表================================
// 当前的对话
const selectedSession = ref<Session | null>(null)
// 当前选中的项目
const selectedProject = ref<Project>()
// 当前的对话偏移量
const currentOffset = ref(0)
// 当前的对话列表
const rawMessages = ref<RawSessionMessage[]>([])
// 转换后的对话列表
const convertedMessages = ref<Message[]>([])
const messageLoading = ref(false)

/**
 * 获取会话 对话
 */
const getMessages = async () => {
  if (!selectedProject.value) {
    MessagePlugin.error('请选择项目！')
    return
  }
  if (!selectedSession.value) {
    MessagePlugin.error('请选择对话！')
    return
  }
  try {
    messageLoading.value = true
    const res = await api.sessionMessages(selectedProject.value.name, selectedSession.value.id, 40, currentOffset.value)
    if (res.redirected) return
    if (res.type === 'cors') return
    if (!res.ok) {
      MessagePlugin.error('请求对话失败！')
      return
    }
    const data = await res.json()
    rawMessages.value = data.messages
    convertedMessages.value = convertSessionMessages(data.messages)
    console.log('rawMessages:', rawMessages.value, 'convert：', convertedMessages.value)
  } catch (error) {
    console.error(error)
  } finally {
    messageLoading.value = false
  }
}

/*
 *会话点击事件
 */
const handleSessionClick = (project: Project, session: Session, isFetch: boolean = true) => {
  selectedSession.value = session
  selectedProject.value = project
  if (isFetch) {
    getMessages()
  }
  console.log('project', project)
}

/** 是否在新建会话 */
const isNewSessioning = ref(false)
/** 新建会话 */
const newSession = (project: Project) => {
  selectedProject.value = project
  isNewSessioning.value = true
  clearSessionData()
}
/** 清理会话 */
const clearSessionData = () => {
  selectedSession.value = null
  rawMessages.value = []
  convertedMessages.value = []
}
// 删除会话列表
const delSession = async (projectName: string, id: string) => {
  const incetance = DialogPlugin.confirm({
    header: '提示',
    body: `确认永久删除该会话？`,
    onConfirm: async () => {
      try {
        projectLoading.value = true
        await api.deleteSession(projectName, id)
        incetance.destroy()
        // 如果删除的是当前选中的，则清理会话
        if (id === selectedSession.value?.id) {
          clearSessionData()
        }
        await getProjects()
      } finally {
        projectLoading.value = false
      }
    },
  })
}

export const useChat = () => {
  return {
    projects,
    delProject,
    filteredProjects,
    projectLoading,
    searchValue,
    sortBy,
    getProjects,
    delSession,
    selectedProject,
    rawMessages,
    convertedMessages,
    selectedSession,
    getMessages,
    handleSessionClick,
    isNewSessioning,
    newSession,
  }
}

export interface MessageRes {
  hasMore: boolean
  limit: number
  offset: number
  total: number
  messages: RawSessionMessage[]
}
