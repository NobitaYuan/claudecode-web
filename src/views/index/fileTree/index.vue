<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { SelectedFile, ViewMode } from './types/file'
import { useFileTree } from './composables/useFileTree'
import FileTreeHeader from './components/FileTreeHeader.vue'
import FileTreeEmpty from './components/FileTreeEmpty.vue'
import FileTreeSimpleView from './components/FileTreeSimpleView.vue'
import FileTreeCompactView from './components/FileTreeCompactView.vue'
import FileTreeDetailedView from './components/FileTreeDetailedView.vue'
import CodeEditor from './components/CodeEditor.vue'
import ImageViewer from './components/ImageViewer.vue'
import { Project } from '../types'

const props = defineProps<{
  selectedProject: Project
}>()

// 状态
const searchQuery = ref('')
const viewMode = ref<ViewMode>('detailed')
const expandedDirs = ref<Set<string>>(new Set())
const selectedFile = ref<SelectedFile | null>(null)
const selectedImage = ref<SelectedFile | null>(null)

// 使用 composable
const { files, loading, fetchFiles, filterFiles, formatFileSize, formatRelativeTime, isImageFile, getFileIconName } = useFileTree(
  computed(() => props.selectedProject.name),
)

// 过滤后的文件列表
const filteredFiles = computed(() => {
  if (!searchQuery.value.trim()) {
    return files.value
  }
  return filterFiles(files.value, searchQuery.value.toLowerCase())
})

// 切换目录展开/收起
const toggleDirectory = (path: string) => {
  const newExpanded = new Set(expandedDirs.value)
  if (newExpanded.has(path)) {
    newExpanded.delete(path)
  } else {
    newExpanded.add(path)
  }
  expandedDirs.value = newExpanded
}

// 处理文件选择
const handleSelectFile = (file: Omit<SelectedFile, 'projectPath' | 'projectName'>) => {
  selectedFile.value = {
    ...file,
    projectPath: props.selectedProject.path,
    projectName: props.selectedProject.name,
  }
}

// 处理图片选择
const handleSelectImage = (file: Omit<SelectedFile, 'projectPath' | 'projectName'>) => {
  selectedImage.value = {
    ...file,
    projectPath: props.selectedProject.path,
    projectName: props.selectedProject.name,
  }
}

// 从 localStorage 加载视图模式偏好
onMounted(() => {
  const savedViewMode = localStorage.getItem('file-tree-view-mode')
  if (savedViewMode && ['simple', 'detailed', 'compact'].includes(savedViewMode)) {
    viewMode.value = savedViewMode as ViewMode
  }
})

// 监听 selectedProject 变化，自动获取文件
watch(
  () => props.selectedProject,
  (newProject) => {
    if (newProject) {
      fetchFiles()
    }
  },
  { immediate: true },
)

// 监听搜索变化，自动展开包含匹配项的目录
watch(filteredFiles, (newFilteredFiles) => {
  if (searchQuery.value.trim()) {
    const expandMatches = (items: typeof newFilteredFiles) => {
      items.forEach((item) => {
        if (item.type === 'directory' && item.children && item.children.length > 0) {
          expandedDirs.value = new Set(expandedDirs.value.add(item.path))
          expandMatches(item.children)
        }
      })
    }
    expandMatches(newFilteredFiles)
  }
})
</script>

<template>
  <div class="file-tree">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-text">正在加载文件...</div>
    </div>

    <!-- 主内容 -->
    <template v-else>
      <!-- 头部 -->
      <FileTreeHeader v-model:view-mode="viewMode" v-model:search-query="searchQuery" />

      <!-- 详细视图的列标题 -->
      <div v-if="viewMode === 'detailed' && filteredFiles.length > 0" class="detail-header-container">
        <div class="detail-header">
          <div class="header-col col-name">名称</div>
          <div class="header-col col-size">大小</div>
          <div class="header-col col-modified">修改时间</div>
          <div class="header-col col-permissions">权限</div>
        </div>
      </div>

      <!-- 文件列表区域 -->
      <div class="file-tree-content">
        <!-- 无文件 -->
        <FileTreeEmpty v-if="files.length === 0" :has-search-query="searchQuery.length > 0" />

        <!-- 搜索无结果 -->
        <FileTreeEmpty v-else-if="filteredFiles.length === 0 && searchQuery" :has-search-query="true" />

        <!-- 文件列表 -->
        <div v-else :class="viewMode === 'detailed' ? '' : 'space-y-1'">
          <!-- 简单视图 -->
          <FileTreeSimpleView
            v-if="viewMode === 'simple'"
            :items="filteredFiles"
            :expanded-dirs="expandedDirs"
            :is-image-file="isImageFile"
            :get-file-icon-name="getFileIconName"
            @toggle-dir="toggleDirectory"
            @select-file="handleSelectFile"
            @select-image="handleSelectImage"
            :level="0"
          />

          <!-- 紧凑视图 -->
          <FileTreeCompactView
            v-else-if="viewMode === 'compact'"
            :items="filteredFiles"
            :expanded-dirs="expandedDirs"
            :is-image-file="isImageFile"
            :get-file-icon-name="getFileIconName"
            :format-file-size="formatFileSize"
            @toggle-dir="toggleDirectory"
            @select-file="handleSelectFile"
            @select-image="handleSelectImage"
            :level="0"
          />

          <!-- 详细视图 -->
          <FileTreeDetailedView
            v-else-if="viewMode === 'detailed'"
            :items="filteredFiles"
            :expanded-dirs="expandedDirs"
            :is-image-file="isImageFile"
            :get-file-icon-name="getFileIconName"
            :format-file-size="formatFileSize"
            :format-relative-time="formatRelativeTime"
            @toggle-dir="toggleDirectory"
            @select-file="handleSelectFile"
            @select-image="handleSelectImage"
            :level="0"
          />
        </div>
      </div>

      <!-- Code Editor 模态框 -->
      <CodeEditor v-if="selectedFile" :file="selectedFile" @close="selectedFile = null" />

      <!-- Image Viewer 模态框 -->
      <ImageViewer v-if="selectedImage" :file="selectedImage" @close="selectedImage = null" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.file-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--td-bg-color-container);
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.detail-header-container {
  padding: 8px 16px 0;
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.detail-header {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
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

.file-tree-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.space-y-1 {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
