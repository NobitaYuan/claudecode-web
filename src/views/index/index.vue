<script lang="ts" setup>
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import { useChat } from './hooks/useChat'
import { useWebSocket } from './hooks/useWebSocket'
import { useWebSocketMessageHandler } from './hooks/useWSMessageHandler'
import sidebar from './components/sidebar.vue'
import chatView from './chats/index.vue'
import newProjectDialog from './components/newProjectDialog.vue'
import { Project } from './types'

const showDialog = ref(false)

const { getProjects, rawMessages, isNewSessioning, handleSessionClick } = useChat()

const { connect } = useWebSocket()

useWebSocketMessageHandler()

const onCreated = (data: Project) => {
  handleSessionClick(data, null, false)
  getProjects()
}

onMounted(async () => {
  await getProjects()
  await connect()
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
          <chatView v-if="isNewSessioning || rawMessages?.length" />
          <div class="welcome_container" v-if="!rawMessages?.length">
            <t-empty status="info" title="欢迎使用 Claude Code On Web" description="请从左侧选择一个会话开始"> </t-empty>
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
    overflow-y: auto;
    background-color: var(--td-bg-color-container);

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
</style>
