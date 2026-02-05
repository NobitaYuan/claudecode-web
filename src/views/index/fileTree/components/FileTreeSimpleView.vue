<template>
  <div class="file-tree-simple-view">
    <FileTreeNode
      v-for="item in items"
      :key="item.path"
      :item="item"
      :level="level"
      :expanded-dirs="expandedDirs"
      :is-image-file="isImageFile"
      :get-file-icon-name="getFileIconName"
      @toggle-dir="handleToggleDir"
      @select-file="handleSelectFile"
      @select-image="handleSelectImage"
    />
  </div>
</template>

<script setup lang="ts">
import type { FileItem } from '../types/file'
import FileTreeNode from './FileTreeNode.vue'

defineProps<{
  items: FileItem[]
  level?: number
  expandedDirs: Set<string>
  isImageFile: (filename: string) => boolean
  getFileIconName: (filename: string) => string
}>()

const emit = defineEmits<{
  'toggle-dir': [path: string]
  'select-file': [file: { name: string; path: string; projectPath: string; projectName: string }]
  'select-image': [file: { name: string; path: string; projectPath: string; projectName: string }]
}>()

const handleToggleDir = (path: string) => {
  emit('toggle-dir', path)
}

const handleSelectFile = (file: { name: string; path: string; projectPath: string; projectName: string }) => {
  emit('select-file', file)
}

const handleSelectImage = (file: { name: string; path: string; projectPath: string; projectName: string }) => {
  emit('select-image', file)
}
</script>

<style scoped lang="scss">
.file-tree-simple-view {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
