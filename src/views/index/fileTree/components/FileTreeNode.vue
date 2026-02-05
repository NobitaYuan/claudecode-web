<template>
  <div class="file-tree-node">
    <div class="node-content" :style="{ paddingLeft: `${level * 16 + 12}px` }" @click="handleClick">
      <div class="node-item">
        <!-- 目录图标 -->
        <t-icon
          v-if="item.type === 'directory'"
          :name="isExpanded ? 'folder-open' : 'folder'"
          :class="['node-icon', isExpanded ? 'icon-open' : 'icon-closed']"
        />
        <!-- 文件图标 -->
        <t-icon v-else :name="getFileIconName(item.name)" class="node-icon icon-file" />
        <span class="node-name">{{ item.name }}</span>
      </div>
    </div>

    <!-- 目录子项 -->
    <FileTreeSimpleView
      v-if="item.type === 'directory' && isExpanded && item.children && item.children.length > 0"
      :items="item.children"
      :level="level + 1"
      :expanded-dirs="expandedDirs"
      :is-image-file="isImageFile"
      :get-file-icon-name="getFileIconName"
      @toggle-dir="$emit('toggle-dir', $event)"
      @select-file="$emit('select-file', $event)"
      @select-image="$emit('select-image', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileItem } from '../types/file'
import FileTreeSimpleView from './FileTreeSimpleView.vue'

const props = defineProps<{
  item: FileItem
  level: number
  expandedDirs: Set<string>
  isImageFile: (filename: string) => boolean
  getFileIconName: (filename: string) => string
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
      projectPath: '', // 由父组件填充
      projectName: '', // 由父组件填充
    })
  } else {
    emit('select-file', {
      name: props.item.name,
      path: props.item.path,
      projectPath: '', // 由父组件填充
      projectName: '', // 由父组件填充
    })
  }
}
</script>

<style scoped lang="scss">
.file-tree-node {
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

.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.node-icon {
  flex-shrink: 0;
  font-size: 16px;

  &.icon-open {
    color: var(--td-brand-color);
  }

  &.icon-closed {
    color: var(--td-text-color-secondary);
  }

  &.icon-file {
    &.icon-code {
      color: var(--td-success-color);
    }

    &.icon-doc {
      color: var(--td-brand-color);
    }

    &.icon-image {
      color: var(--td-warning-color);
    }
  }
}

.node-name {
  font-size: 14px;
  color: var(--td-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
