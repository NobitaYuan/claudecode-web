<script lang="ts" setup>
import { useChat } from './hooks/useChat'
import chatView from './chats/index.vue'
import { useWebSocket } from './hooks/useWebSocket'
import { formatLastActivity } from '@/utils/tools'
import { useWebSocketMessageHandler } from './hooks/useWebSocketMessageHandler'

const activeProjects = ref<string[]>([])

const { filteredProjects, getProjects, searchValue, projectLoading, sortBy, selectedProject, selectedSession, rawMessages, handleSessionClick } = useChat()

const { connect } = useWebSocket()

useWebSocketMessageHandler()

onMounted(async () => {
  await getProjects()
  await connect()
})
</script>

<template>
  <div class="index_container">
    <!-- 左侧边栏 -->
    <div class="left">
      <t-input style="width: 290px" v-model="searchValue" placeholder="搜索项目或会话..." clearable class="search_input">
        <template #prefix-icon>
          <t-icon name="search" />
        </template>
      </t-input>

      <div class="filter_container">
        <div class="filter_label">排序方式</div>
        <t-radio-group v-model="sortBy" variant="default-filled">
          <t-radio value="recent">最近活动</t-radio>
          <t-radio value="name">名称</t-radio>
        </t-radio-group>
      </div>

      <div v-if="projectLoading" class="loading_container">
        <t-loading size="small" />
      </div>

      <div v-else-if="filteredProjects.length === 0" class="empty_container">
        <t-empty description="暂无项目" size="small" />
      </div>

      <div v-else class="projects_list">
        <t-collapse v-model="activeProjects" expandMutex :borderless="true" class="projects_collapse">
          <t-collapse-panel
            v-for="project in filteredProjects"
            :key="project.name"
            :value="project.name"
            class="project_panel"
            :class="{ active: project.name === selectedProject?.name }"
          >
            <template #header>
              <div class="project_header">
                <div class="project_header_left">
                  <t-icon name="folder" size="18px" class="project_icon" />
                  <div class="project_info">
                    <div class="project_name">
                      {{ project.displayName || project.name }}
                    </div>
                    <div class="project_meta">
                      <t-tag v-if="project.sessionMeta?.total" size="small" variant="light"> {{ project.sessionMeta.total }}个会话 </t-tag>
                      <span v-if="project.sessions?.length > 0" class="last_activity">
                        {{ formatLastActivity(project.sessions[0].lastActivity) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template #default>
              <div class="sessions_list">
                <div
                  v-for="session in project.sessions"
                  :key="session.id"
                  class="session_item"
                  :class="{ active: session.id === selectedSession?.id }"
                  @click="handleSessionClick(project, session)"
                >
                  <div class="session_header">
                    <div class="session_summary">
                      {{ session.summary.replace(/<[^>]*>/g, '').substring(0, 50) }}
                      <span v-if="session.summary.length > 50">...</span>
                    </div>
                  </div>
                  <div class="session_time">
                    {{ formatLastActivity(session.lastActivity) }}
                    <t-tag theme="success" size="small" variant="outline"> {{ session.messageCount }}条消息 </t-tag>
                  </div>
                </div>

                <div v-if="!project.sessions || project.sessions.length === 0" class="no_sessions">
                  <t-empty description="暂无会话" size="small" />
                </div>
              </div>
            </template>
          </t-collapse-panel>
        </t-collapse>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="right">
      <div class="welcome_container" v-if="!rawMessages?.length">
        <t-empty status="info" title="欢迎使用 Claude Code Web">
          <p class="welcome_text">请从左侧选择一个会话开始</p>
        </t-empty>
      </div>
      <chatView v-else />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.index_container {
  height: 100%;
  display: flex;
  gap: 12px;
  padding: 12px;

  .left {
    width: 320px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--td-component-border);
    background-color: var(--td-bg-color-container);

    .search_input {
      margin: 12px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .filter_container {
      padding: 0 12px 12px 12px;
      border-bottom: 1px solid var(--td-component-border);

      .filter_label {
        font-size: 12px;
        color: var(--td-text-color-secondary);
        margin-bottom: 8px;
      }

      :deep(.t-radio-group) {
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 8px;
      }
    }

    .loading_container,
    .empty_container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      min-height: 200px;
    }

    .projects_list {
      flex: 1;
      overflow-y: auto;
      padding: 0 12px 12px 12px;

      .projects_collapse {
        :deep(.t-collapse-panel__header) {
          transition: background-color 0.2s;

          &:hover {
            background-color: var(--td-bg-color-container-hover);
          }
        }
        :deep(.t-collapse-panel__header--blank) {
          flex: unset;
        }

        :deep(.t-collapse-panel__body) {
          padding: 0;
          .t-collapse-panel__content {
            padding: 4px 0px 4px 30px;
          }
        }

        .project_panel {
          margin-bottom: 0;
          &.active {
            background-color: var(--td-brand-color-1);
          }
          .project_header {
            flex: 1;
            display: flex;
            overflow: auto;
            .project_header_left {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              flex: 1;
              overflow: hidden;

              .project_icon {
                color: var(--td-brand-color);
                flex-shrink: 0;
                margin-top: 2px;
              }

              .project_info {
                flex: 1;
                min-width: 0;
                overflow: hidden;

                .project_name {
                  width: 100%;
                  font-size: 14px;
                  font-weight: 500;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .project_meta {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 8px;
                  margin-top: 4px;

                  .last_activity {
                    color: var(--td-text-color-placeholder);
                    font-size: 12px;
                  }
                }
              }
            }
          }
        }

        .sessions_list {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .session_item {
            padding: 8px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 4px;
            border: 1px solid transparent;

            &:hover {
              background-color: var(--td-bg-color-container-hover);
            }

            &.active {
              background-color: var(--td-brand-color-1);
            }

            .session_header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 8px;
              margin-bottom: 4px;

              .session_summary {
                flex: 1;
                font-size: 12px;
                color: var(--td-text-color-primary);
                overflow: hidden;
                text-overflow: ellipsis;
                // display: -webkit-box;
                // -webkit-line-clamp: 2;
                // -webkit-box-orient: vertical;
                white-space: nowrap;
                margin-bottom: 4px;
                font-weight: bold;
              }
            }

            .session_time {
              font-size: 12px;
              color: var(--td-text-color-placeholder);
              font-weight: 400;
              display: flex;
              justify-content: space-between;
            }
          }

          .no_sessions {
            padding: 20px 0;
          }
        }
      }
    }
  }

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
