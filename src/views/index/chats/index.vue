<script setup lang="ts">
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import { type ChatStatus } from 'ai'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { GlobeIcon, MicIcon } from 'lucide-vue-next'
import { useChat } from '../hooks/useChat'
import ChatInterface from './components/ChatInterface.vue'
import ThinkingMessage from './components/thinkingStatus.vue'
import { useCreateDiff } from './utils/createDiff'
import { useWebSocket } from '../hooks/useWebSocket'
import { Message } from '../hooks/utils/message'
import permissionModeSelector from './components/permissionModeSelector.vue'
import { useLocalStorage } from '@vueuse/core'
import { useClaudePermission } from '../hooks/useClaudePermission'
import questionSelecterDialog from './components/questionSelecterDialog.vue'
import permissionDecision from './components/permissionDecision.vue'

const thinkingModes = [
  {
    id: 'none',
    name: 'Standard',
    description: 'Regular Claude response',
    prefix: '',
    color: 'text-gray-600',
  },
  {
    id: 'think',
    name: 'Think',
    description: 'Basic extended thinking',
    prefix: 'think',
    color: 'text-blue-600',
  },
  {
    id: 'think-hard',
    name: 'Think Hard',
    description: 'More thorough evaluation',
    prefix: 'think hard',
    color: 'text-purple-600',
  },
  {
    id: 'think-harder',
    name: 'Think Harder',
    description: 'Deep analysis with alternatives',
    prefix: 'think harder',
    color: 'text-indigo-600',
  },
  {
    id: 'ultrathink',
    name: 'Ultrathink',
    description: 'Maximum thinking budget',
    prefix: 'ultrathink',
    color: 'text-red-600',
  },
]

const { convertedMessages, selectedProject, selectedSession } = useChat()
const { sendMessage, isLoading } = useWebSocket()
const { cancelAllPermission } = useClaudePermission()

/** 是否使用联网搜索 */
const useWebSearch = ref(false)
/** 是否使用麦克风 */
const useMicrophone = ref(false)
/** 状态 */
const status = ref<ChatStatus>('ready')
/** 思考模式 */
const thinkingMode = ref('')
/** 模式 */
const permissionMode = useLocalStorage('permissionMode', 'default')

function addUserMessage(content: string) {
  // ============================================================
  // 逻辑块 1: 基本验证
  // 检查是否正在加载、是否选中了项目
  // ============================================================
  if (isLoading.value || !selectedProject.value) {
    return
  }

  // ============================================================
  // 逻辑块 2: 思考模式前缀
  // 如果用户选择了"思考模式"，会在消息前加前缀
  // ============================================================
  let messageContent = content
  const selectedThinkingMode = thinkingModes.find((mode) => mode.id === thinkingMode.value)
  if (selectedThinkingMode && selectedThinkingMode.prefix) {
    messageContent = `${selectedThinkingMode.prefix}: ${content}`
  }

  // ============================================================
  // 逻辑块 4: 添加用户消息到聊天
  // 在聊天界面显示用户发送的消息
  // ============================================================
  const userMessage: Message = {
    type: 'user',
    content: messageContent,
    timestamp: new Date(),
  }

  convertedMessages.value.push(userMessage)

  // ============================================================
  // 逻辑块 5: 设置加载状态
  // - 显示"正在处理"状态
  // - 允许中止会话
  // - 显示 Claude 状态（处理中、token 数等）
  // - 自动滚动到底部
  // ============================================================

  // setCanAbortSession(true)
  // setClaudeStatus({
  //   text: 'Processing',
  //   tokens: 0,
  //   can_interrupt: true,
  // })

  // 始终在用户发送消息时滚动到底部并重置滚动状态
  // setIsUserScrolledUp(false)
  // setTimeout(() => scrollToBottom(), 100)

  // ============================================================
  // 逻辑块 8: 发送 Claude 命令
  // 发送 claude-command 类型的 WebSocket 消息
  // ============================================================
  const msg = {
    type: 'claude-command',
    command: messageContent,
    options: {
      projectPath: selectedProject.value?.path,
      cwd: selectedProject.value?.fullPath,
      sessionId: selectedSession.value.id,
      resume: !!selectedSession.value,
      permissionMode: permissionMode.value, // ['default', 'acceptEdits', 'bypassPermissions', 'plan']
      model: 'sonnet',
    },
  }
  console.log('msg', msg)
  sendMessage(msg)
  isLoading.value = true

  // ============================================================
  // 逻辑块 9: 清空输入状态
  // 发送消息后清空输入框和相关状态
  // ============================================================
  thinkingMode.value = null
}

function handleSubmit(message: PromptInputMessage) {
  const text = message.text.trim()
  const hasText = text.length > 0
  const hasAttachments = message.files.length > 0

  if (!hasText && !hasAttachments) return

  status.value = 'submitted'
  addUserMessage(hasText ? text : '附件')
}

// 打断发送
function abortSession() {
  sendMessage({
    type: 'abort-session',
    sessionId: selectedSession.value.id,
    provider: 'claude',
  })
  cancelAllPermission()
}

function sendAnswer(msg: any) {
  sendMessage(msg)
}

function toggleMicrophone() {
  useMicrophone.value = !useMicrophone.value
}

function toggleWebSearch() {
  useWebSearch.value = !useWebSearch.value
}

const { createDiff } = useCreateDiff()

const ConversationScrollButtonRef = ref<InstanceType<typeof ConversationScrollButton>>()
const scrollToBottom = () => {
  if (!ConversationScrollButtonRef.value?.scrollToBottom) return
  ConversationScrollButtonRef.value.scrollToBottom()
}

onMounted(() => {
  scrollToBottom()
})

defineExpose({
  scrollToBottom,
})
</script>

<template>
  <div class="chat relative flex size-full flex-col divide-y overflow-hidden">
    <Conversation :initial="false" :anchor="'auto'" :resize="{ damping: 0.8, stiffness: 0.05, mass: 1 }">
      <ConversationContent>
        <template v-for="(msg, index) in convertedMessages" :key="msg?.uuid || index">
          <ChatInterface :message="msg" :prevMessage="index > 0 ? convertedMessages[index - 1] : null" :index="index" :createDiff="createDiff" />
        </template>
        <t-empty v-if="!convertedMessages?.length" :title="'暂无数据'"></t-empty>
        <ThinkingMessage v-if="isLoading" />
      </ConversationContent>
      <ConversationScrollButton ref="ConversationScrollButtonRef" />
    </Conversation>

    <div class="grid shrink-0 gap-4 pt-4 relative">
      <questionSelecterDialog @sendAnswer="sendAnswer" />
      <permissionDecision @sendAnswer="sendAnswer" />
      <div class="w-full px-4 pb-4">
        <PromptInput class="w-full" multiple global-drop @submit="handleSubmit">
          <!-- <PromptInputHeader> -->
          <PromptInputAttachments>
            <template #default="{ file }">
              <PromptInputAttachment :file="file" />
            </template>
          </PromptInputAttachments>
          <!-- </PromptInputHeader> -->
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools>
              <permissionModeSelector v-model:mode="permissionMode" />
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputButton :variant="useMicrophone ? 'default' : 'ghost'" @click="toggleMicrophone">
                <MicIcon :size="16" />
                <span class="sr-only">Microphone</span>
              </PromptInputButton>

              <PromptInputButton :variant="useWebSearch ? 'default' : 'ghost'" @click="toggleWebSearch">
                <GlobeIcon :size="16" />
                <span>联网搜索</span>
              </PromptInputButton>
            </PromptInputTools>

            <div class="flex gap-2">
              <PromptInputSubmit :disabled="status === 'streaming'" :status="status" />
              <t-button variant="outline" theme="danger" @click="abortSession" v-if="isLoading">停止对话</t-button>
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat {
  padding: 12px;
}
</style>
