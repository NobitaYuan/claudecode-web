<template>
  <div class="file-tree-detail-node">
    <div class="node-content" :style="{ paddingLeft: `${level * 16 + 12}px` }" @click="handleClick">
      <div class="node-grid">
        <!-- 名称列 -->
        <div class="node-col col-name">
          <t-icon
            v-if="item.type === 'directory'"
            :name="isExpanded ? 'folder-open-1' : 'folder-1'"
            :class="['node-icon', isExpanded ? 'icon-open' : 'icon-closed']"
          />
          <t-icon v-else :name="getFileIconName(item.name)" class="node-icon icon-file" />
          <span class="node-name">{{ item.name }}</span>
        </div>

        <!-- 大小列 -->
        <div class="node-col col-size">
          {{ item.type === 'file' ? formatFileSize(item.size) : '-' }}
        </div>

        <!-- 修改时间列 -->
        <div class="node-col col-modified">
          {{ formatRelativeTime(item.modified) }}
        </div>

        <!-- 权限列 -->
        <div class="node-col col-permissions">
          <span class="permissions-text">{{ item.permissionsRwx || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 目录子项 -->
    <FileTreeDetailedView
      v-if="item.type === 'directory' && isExpanded && item.children && item.children.length > 0"
      :items="item.children"
      :level="level + 1"
      :expanded-dirs="expandedDirs"
      :is-image-file="isImageFile"
      :get-file-icon-name="getFileIconName"
      :format-file-size="formatFileSize"
      :format-relative-time="formatRelativeTime"
      @toggle-dir="$emit('toggle-dir', $event)"
      @select-file="$emit('select-file', $event)"
      @select-image="$emit('select-image', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FileItem } from '../types/file'
import FileTreeDetailedView from './FileTreeDetailedView.vue'

const props = defineProps<{
  item: FileItem
  level: number
  expandedDirs: Set<string>
  isImageFile: (filename: string) => boolean
  getFileIconName: (filename: string) => string
  formatFileSize: (bytes?: number) => string
  formatRelativeTime: (date?: string) => string
}>()

const emit = defineEmits<{
  'toggle-dir': [path: string]
  'select-file': [file: { name: string; path: string; projectPath: string; projectName: string }]
  'select-image': [file: { name: string; path: string; projectPath: string; projectName: string }]
}>()

const isExpanded = computed(() => props.expandedDirs.has(props.item.path))

const handleClick = () => {
  if (props.item.type === 'directory') {
    emit('toggle-dir', props.item.path)
  } else if (props.isImageFile(props.item.name)) {
    emit('select-image', {
      name: props.item.name,
      path: props.item.path,
      projectPath: '',
      projectName: '',
    })
  } else {
    emit('select-file', {
      name: props.item.name,
      path: props.item.path,
      projectPath: '',
      projectName: '',
    })
  }
}
</script>

<style scoped lang="scss">
.file-tree-detail-node {
  user-select: none;
}

.node-content {
  cursor: pointer;
  padding: 8px 12px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--td-bg-color-container-hover);
  }
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 8px;
  align-items: center;
}

.node-col {
  display: flex;
  align-items: center;
  font-size: 14px;

  &.col-name {
    grid-column: span 5;
    gap: 8px;
    min-width: 0;
  }

  &.col-size {
    grid-column: span 2;
    color: var(--td-text-color-secondary);
  }

  &.col-modified {
    grid-column: span 3;
    color: var(--td-text-color-secondary);
  }

  &.col-permissions {
    grid-column: span 2;
    color: var(--td-text-color-secondary);
  }
}

.node-icon {
  flex-shrink: 0;
  font-size: 16px;

  &.icon-open {
    color: var(--td-warning-color);
  }

  &.icon-closed {
    // color: var(--td-text-color-secondary);
  }

  &.icon-file {
    color: var(--td-brand-color);
  }
}

.node-name {
  color: var(--td-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.permissions-text {
  font-family: monospace;
}
</style>
