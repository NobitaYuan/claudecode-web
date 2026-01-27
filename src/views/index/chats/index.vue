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
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { GlobeIcon, MicIcon } from 'lucide-vue-next'
import { useChat } from '../hooks/useChat'
import ChatInterface from './components/chatInterface.vue'

const { convertedMessages } = useChat()

/** 是否使用联网搜索 */
const useWebSearch = ref(false)
/** 是否使用麦克风 */
const useMicrophone = ref(false)
/** 状态 */
const status = ref<ChatStatus>('ready')

function addUserMessage(content: string) {}

function handleSubmit(message: PromptInputMessage) {
  console.log('message', message)
  const text = message.text.trim()
  const hasText = text.length > 0
  const hasAttachments = message.files.length > 0

  if (!hasText && !hasAttachments) return

  status.value = 'submitted'
  addUserMessage(hasText ? text : '附件')
}

function toggleMicrophone() {
  useMicrophone.value = !useMicrophone.value
}

function toggleWebSearch() {
  useWebSearch.value = !useWebSearch.value
}

import { useCreateDiff } from './utils/createDiff'

const { createDiff } = useCreateDiff()
</script>

<template>
  <div class="chat relative flex size-full flex-col divide-y overflow-hidden">
    <Conversation>
      <ConversationContent>
        <template v-for="(msg, index) in convertedMessages" :key="index">
          <ChatInterface :message="msg" :index="index" :createDiff="createDiff" />
        </template>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>

    <div class="grid shrink-0 gap-4 pt-4">
      <div class="w-full px-4 pb-4">
        <PromptInput class="w-full" multiple global-drop @submit="handleSubmit">
          <PromptInputHeader>
            <PromptInputAttachments>
              <template #default="{ file }">
                <PromptInputAttachment :file="file" />
              </template>
            </PromptInputAttachments>
          </PromptInputHeader>

          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools>
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

            <PromptInputSubmit :disabled="status === 'streaming'" :status="status" />
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
