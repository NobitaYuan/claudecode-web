<template>
  <div class="file-tree-compact-node">
    <div class="node-content" :style="{ paddingLeft: `${level * 16 + 12}px` }" @click="handleClick">
      <div class="node-main">
        <div class="node-left">
          <t-icon
            v-if="item.type === 'directory'"
            :name="isExpanded ? 'folder-open-1' : 'folder-1'"
            :class="['node-icon', isExpanded ? 'icon-open' : 'icon-closed']"
          />
          <t-icon v-else :name="getFileIconName(item.name)" class="node-icon icon-file" />
          <span class="node-name">{{ item.name }}</span>
        </div>
        <div class="node-right">
          <span v-if="item.type === 'file'" class="node-info">{{ formatFileSize(item.size) }}</span>
          <span v-if="item.type === 'file'" class="node-info node-permissions">{{ item.permissionsRwx || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 目录子项 -->
    <FileTreeCompactView
      v-if="item.type === 'directory' && isExpanded && item.children && item.children.length > 0"
      :items="item.children"
      :level="level + 1"
      :expanded-dirs="expandedDirs"
      :is-image-file="isImageFile"
      :get-file-icon-name="getFileIconName"
      :format-file-size="formatFileSize"
      @toggle-dir="$emit('toggle-dir', $event)"
      @select-file="$emit('select-file', $event)"
      @select-image="$emit('select-image', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FileItem } from '../types/file'
import FileTreeCompactView from './FileTreeCompactView.vue'

const props = defineProps<{
  item: FileItem
  level: number
  expandedDirs: Set<string>
  isImageFile: (filename: string) => boolean
  getFileIconName: (filename: string) => string
  formatFileSize: (bytes?: number) => string
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
.file-tree-compact-node {
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

.node-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.node-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.node-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
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
  font-size: 14px;
  color: var(--td-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-info {
  font-size: 12px;
  color: var(--td-text-color-secondary);

  &.node-permissions {
    font-family: monospace;
  }
}
</style>
