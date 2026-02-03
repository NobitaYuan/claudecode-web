<script lang="ts" setup>
import { formatLastActivity } from '@/utils/tools'
import { useChat } from '../hooks/useChat'

const emit = defineEmits(['add'])

const activeProjects = ref<string[]>([])
const {
  getProjects,
  delSession,
  projects,
  filteredProjects,
  searchValue,
  projectLoading,
  sortBy,
  selectedProject,
  selectedSession,
  handleSessionClick,
  newSession,
} = useChat()

const reloadPro = () => {
  searchValue.value = ''
  projects.value = []
  getProjects()
}
</script>

<template>
  <div class="chat_sidebar">
    <div class="flex gap-2 items-center p-[12px]">
      <t-button block @click="emit('add')">
        <div class="flex items-center gap-2">
          <t-icon name="folder-add-1" />
          新建项目
        </div>
      </t-button>
      <t-link hover="color" @click="reloadPro">
        <t-icon name="refresh" />
      </t-link>
    </div>
    <t-input v-model="searchValue" placeholder="搜索项目或会话..." clearable class="search_input">
      <template #prefix-icon>
        <t-icon name="search" />
      </template>
    </t-input>
    <div class="filter_container">
      <div class="filter_label">排序方式</div>
      <t-radio-group v-model="sortBy" variant="default-filled">
        <t-radio value="recent">最近活动</t-radio>
        <t-radio value="name">名称</t-radio>
        <t-radio value="default">默认</t-radio>
      </t-radio-group>
    </div>

    <div v-if="filteredProjects.length === 0" class="empty_container">
      <t-empty title="暂无项目" />
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
              <div class="project_info">
                <div class="project_name">
                  <t-icon name="folder" size="18px" class="project_icon" />
                  <div class="name_text" :title="project.displayName || project.name">
                    {{ project.displayName || project.name }}
                  </div>
                </div>
                <div class="project_meta">
                  <t-tag v-if="project.sessionMeta?.total" size="small" variant="light"> {{ project.sessionMeta.total }}个会话 </t-tag>
                  <span class="path" :title="project.path">{{ project.path }}</span>
                  <span v-if="project.sessions?.length > 0" class="last_activity">
                    {{ formatLastActivity(project.sessions[0].lastActivity) }}
                  </span>
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
                  <t-tag class="tag" theme="success" size="small" variant="outline"> {{ session.messageCount }}条消息 </t-tag>
                </div>
                <button class="del w-6 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded flex items-center justify-center">
                  <t-link @click.stop="delSession(project.name, session.id)" theme="danger" hover="color">
                    <t-icon name="delete" size="16px" />
                  </t-link>
                </button>
              </div>

              <div v-if="!project.sessions || project.sessions.length === 0" class="no_sessions">
                <span>暂无会话</span>
              </div>
              <div class="pr-[24px]">
                <t-button block size="small" @click="newSession(project)">
                  <div class="flex items-center">
                    <t-icon name="add"></t-icon>
                    新建会话
                  </div>
                </t-button>
              </div>
            </div>
          </template>
        </t-collapse-panel>
      </t-collapse>
    </div>
    <t-loading :loading="projectLoading" attach="chat_sidebar" />
  </div>
</template>

<style lang="scss" scoped>
.chat_sidebar {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--td-component-border);
  background-color: var(--td-bg-color-container);

  .search_input {
    flex-shrink: 0;
    padding: 12px;
    padding-top: 4px;
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
    padding: 12px 0px 16px 12px;

    .projects_collapse {
      :deep(.t-collapse-panel__header) {
        transition: background-color 0.2s;
        flex-direction: row-reverse;
        padding: 12px 12px;

        .t-collapse-panel__icon {
          margin-right: 0px;
          margin-left: 8px;
        }
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
          .project_icon {
            color: var(--td-brand-color);
          }
        }
        .project_header {
          flex: 1;
          display: flex;
          overflow: auto;

          .project_icon {
            // color: var(--td-brand-color);
            flex-shrink: 0;
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
        gap: 4px;

        .session_item {
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 4px;
          border: 1px solid transparent;
          position: relative;

          &:hover {
            background-color: var(--td-bg-color-container-hover);
            .session_time {
              .tag {
                display: none;
              }
            }
            .del {
              display: flex;
            }
          }

          &.active {
            background-color: var(--td-brand-color-1);
          }

          .session_header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;

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
          .del {
            position: absolute;
            display: none;
            right: 12px;
            bottom: 10px;
          }
        }

        .no_sessions {
          padding-left: 12px;
        }
      }
    }
  }
}
</style>
