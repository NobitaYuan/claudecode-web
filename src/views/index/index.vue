<script lang="ts" setup>
import { useChat } from './hooks/useChat'
import { useWebSocket } from './hooks/useWebSocket'
import { useWebSocketMessageHandler } from './hooks/useWebSocketMessageHandler'
import sidebar from './components/sidebar.vue'
import chatView from './chats/index.vue'

const { getProjects, rawMessages } = useChat()

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
      <sidebar />
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
                display: flex;
                gap: 8px;
                align-items: center;
                .name_text {
                  font-size: 14px;
                  font-weight: 500;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
              }

              .project_meta {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                margin-top: 4px;
                .path {
                  flex: 1;
                  font-weight: normal;
                  font-size: 11px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  color: var(--td-text-color-placeholder);
                }
                .last_activity {
                  color: var(--td-text-color-placeholder);
                  font-size: 12px;
                  flex-shrink: 0;
                  font-weight: normal;
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
