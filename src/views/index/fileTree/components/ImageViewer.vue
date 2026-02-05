<template>
  <t-dialog
    :visible="true"
    :footer="false"
    width="70vw"
    top="10vh"
    :close-on-overlay-click="true"
    :show-overlay="true"
    size="large"
    theme="default"
    @close="handleClose"
  >
    <template #header>
      <div class="image-viewer-header">
        <h3 class="header-title">{{ file.name }}</h3>
      </div>
    </template>

    <div class="image-viewer-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-text">正在加载图片...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <div class="error-text">{{ error }}</div>
        <div class="error-path">{{ file.path }}</div>
      </div>

      <!-- 图片显示 -->
      <div v-else-if="imageUrl" class="image-container">
        <img :src="imageUrl" :alt="file.name" class="image-content" />
      </div>
    </div>

    <template #footer>
      <div class="image-viewer-footer">
        <div class="footer-path">{{ file.path }}</div>
      </div>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { SelectedFile } from '../types/file'
import { fileApi } from '../api'

const props = defineProps<{
  file: SelectedFile
}>()

const emit = defineEmits<{
  close: []
}>()

const imageUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)
let objectUrl: string | null = null

const loadImage = async () => {
  loading.value = true
  error.value = null
  imageUrl.value = null

  try {
    const blob = await fileApi.getFileContent(props.file.projectName, props.file.path)
    objectUrl = URL.createObjectURL(blob)
    imageUrl.value = objectUrl
  } catch (err) {
    console.error('加载图片失败:', err)
    error.value = '无法加载图片'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('close')
}

onMounted(() => {
  loadImage()
})

onUnmounted(() => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }
})
</script>

<style scoped lang="scss">
.image-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.image-viewer-content {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--td-bg-color-container);
  border-radius: var(--td-radius-default);
  padding: 16px;
}

.loading-container,
.error-container {
  text-align: center;
}

.loading-text,
.error-text {
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.error-path {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  word-break: break-all;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.image-content {
  max-width: 100%;

  object-fit: contain;
  border-radius: var(--td-radius-default);
  box-shadow: var(--td-shadow-2);
}

.image-viewer-footer {
  padding: 12px 0;
}

.footer-path {
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

// TDesign Dialog 样式覆盖
:deep(.t-dialog) {
  max-width: 90vw;
}

:deep(.t-dialog__body) {
  padding: 16px;
}
</style>
