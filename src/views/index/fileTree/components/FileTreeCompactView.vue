<template>
  <div class="file-tree-compact-view">
    <FileTreeCompactNode
      v-for="item in items"
      :key="item.path"
      :item="item"
      :level="level"
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
import type { FileItem } from '../../types/file'
import FileTreeCompactNode from './FileTreeCompactNode.vue'

defineProps<{
  items: FileItem[]
  level?: number
  expandedDirs: Set<string>
  isImageFile: (filename: string) => boolean
  getFileIconName: (filename: string) => string
  formatFileSize: (bytes?: number) => string
}>()

defineEmits<{
  'toggle-dir': [path: string]
  'select-file': [file: { name: string; path: string; projectPath: string; projectName: string }]
  'select-image': [file: { name: string; path: string; projectPath: string; projectName: string }]
}>()
</script>

<style scoped lang="scss">
.file-tree-compact-view {
  display: flex;
  flex-direction: column;
}
</style>
