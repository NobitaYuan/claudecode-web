import { api } from '@/api/api'
import { MessagePlugin } from 'tdesign-vue-next'
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
 * 获取对话
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
const handleSessionClick = (project: Project, session: Session) => {
  selectedSession.value = session
  selectedProject.value = project
  getMessages()
  console.log('project', project)
}

export const useChat = () => {
  return {
    projects,
    filteredProjects,
    projectLoading,
    searchValue,
    sortBy,
    getProjects,
    selectedProject,
    rawMessages,
    convertedMessages,
    selectedSession,
    getMessages,
    handleSessionClick,
  }
}

export interface MessageRes {
  hasMore: boolean
  limit: number
  offset: number
  total: number
  messages: RawSessionMessage[]
}
