<script lang="ts" setup>
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import { useChat } from './hooks/useChat'
import { useWebSocket } from './hooks/useWebSocket'
import sidebar from './components/sidebar.vue'
import chatView from './chats/index.vue'
import shellView from './shell/index.vue'
import newProjectDialog from './components/newProjectDialog.vue'
import { Project, TabKeyType } from './types'
import tabNavigation from './components/tabNavigation.vue'
import { useLocalStorage } from '@vueuse/core'
import { useWebSocketMessageHandler } from './hooks/useWSMessageHandler'
import fileTree from './fileTree/index.vue'

const showDialog = ref(false)

const { getProjects, rawMessages, isNewSessioning, handleSessionClick, selectedProject, selectedSession } = useChat()

const { connect } = useWebSocket()
useWebSocketMessageHandler()

const onCreated = (data: Project) => {
  handleSessionClick(data, null, false)
  getProjects()
}

const showTab = useLocalStorage<TabKeyType>('activeTab', 'shell')

onMounted(async () => {
  await getProjects()
  connect()
})
</script>

<template>
  <div class="index_container">
    <SplitterGroup :direction="'horizontal'" auto-save-id="splitter-index">
      <SplitterPanel :min-size="10">
        <!-- 左侧边栏 -->
        <sidebar @add="showDialog = true" />
      </SplitterPanel>
      <SplitterResizeHandle>
        <div class="resizeLine"></div>
      </SplitterResizeHandle>
      <SplitterPanel :min-size="10" class="right">
        <!-- 右侧内容区 -->
        <div class="right">
          <div class="header">
            <div class="flex-1">
              <h1 class="text-sm whitespace-nowrap overflow-x-auto scrollbar-hide font-bold mb-[8px]">{{ selectedSession?.summary }}</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ selectedProject?.displayName }}</p>
            </div>
            <div>
              <tabNavigation v-model="showTab" />
            </div>
          </div>
          <div class="interface">
            <template v-if="isNewSessioning || rawMessages?.length">
              <chatView v-if="showTab === 'chat'" />
              <shellView v-else-if="showTab === 'shell'" :selectedProject="selectedProject" :selectedSession="selectedSession" />
              <fileTree v-else-if="showTab === 'files'" :selectedProject="selectedProject" :selectedSession="selectedSession" />
            </template>
            <div class="welcome_container" v-else>
              <t-empty status="info" title="欢迎使用 Claude Code On Web" description="请从左侧选择一个会话开始"> </t-empty>
            </div>
          </div>
        </div>
      </SplitterPanel>
    </SplitterGroup>
    <newProjectDialog v-if="showDialog" @close="showDialog = false" @created="onCreated" />
  </div>
</template>

<style lang="scss" scoped>
.index_container {
  height: 100%;
  // padding: 12px;

  .right {
    flex: 1;
    height: 100%;
    background-color: var(--td-bg-color-container);
    display: flex;
    flex-direction: column;
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px 12px 12px;
      border-bottom: 1px solid hsl(var(--border));
    }
    .interface {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      .welcome_container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px;

        .welcome_text {
          color: var(--td-text-color-secondary);
          font-size: 14px;
          margin-top: 16px;
        }
      }
    }
  }
}
</style>
