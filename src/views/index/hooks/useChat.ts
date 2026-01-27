import { api } from '@/api/api'
import { MessagePlugin } from 'tdesign-vue-next'
import { Project } from '../types'
import { Message, RawSessionMessage } from './utils/message'
import { convertSessionMessages } from './utils/messageConverter'

// 当前的对话id
const selectedSessionId = ref<string>()
// 当前选中的项目
const selectedProject = ref<Project>()
// 当前的对话偏移量
const currentOffset = ref(0)
// 当前的对话列表
const rawMessages = ref<RawSessionMessage[]>([])
// 转换后的对话列表
const convertedMessages = ref<Message[]>([])

const getMessages = async () => {
  if (!selectedProject.value) {
    MessagePlugin.error('请选择项目！')
    return
  }
  if (!selectedSessionId.value) {
    MessagePlugin.error('请选择对话！')
    return
  }
  const res = await api.sessionMessages(selectedProject.value.name, selectedSessionId.value, 20, currentOffset.value)
  if (!res.ok) {
    MessagePlugin.error('请求对话失败！')
    return
  }
  const data = await res.json()
  rawMessages.value = data.messages
  convertedMessages.value = convertSessionMessages(data.messages)
  console.log('before', rawMessages.value, convertedMessages.value)
}
export const useChat = () => {
  return {
    selectedProject,
    selectedSessionId,
    rawMessages,
    convertedMessages,
    getMessages,
  }
}

export interface MessageRes {
  hasMore: boolean
  limit: number
  offset: number
  total: number
  messages: RawSessionMessage[]
}
