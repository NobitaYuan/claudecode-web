<template>
  <div class="file-tree-detailed-view">
    <!-- 列标题 -->
    <!-- <div v-if="items.length > 0" class="detail-header">
      <div class="header-col col-name">名称</div>
      <div class="header-col col-size">大小</div>
      <div class="header-col col-modified">修改时间</div>
      <div class="header-col col-permissions">权限</div>
    </div> -->

    <!-- 文件列表 -->
    <FileTreeDetailNode
      v-for="item in items"
      :key="item.path"
      :item="item"
      :level="level"
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
import type { FileItem } from '../types/file'
import FileTreeDetailNode from './FileTreeDetailNode.vue'

defineProps<{
  items: FileItem[]
  level?: number
  expandedDirs: Set<string>
  isImageFile: (filename: string) => boolean
  getFileIconName: (filename: string) => string
  formatFileSize: (bytes?: number) => string
  formatRelativeTime: (date?: string) => string
}>()

defineEmits<{
  'toggle-dir': [path: string]
  'select-file': [file: { name: string; path: string; projectPath: string; projectName: string }]
  'select-image': [file: { name: string; path: string; projectPath: string; projectName: string }]
}>()
</script>

<style scoped lang="scss">
.file-tree-detailed-view {
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.header-col {
  &.col-name {
    grid-column: span 5;
  }

  &.col-size {
    grid-column: span 2;
  }

  &.col-modified {
    grid-column: span 3;
  }

  &.col-permissions {
    grid-column: span 2;
  }
}
</style>
