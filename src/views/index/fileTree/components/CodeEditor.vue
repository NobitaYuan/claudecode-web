<template>
  <t-dialog
    :visible="true"
    :footer="false"
    :close-on-overlay-click="false"
    :show-overlay="true"
    closeOnEscKeydown
    size="large"
    theme="default"
    class="code-editor-dialog"
    @close="handleClose"
    width="80vw"
    top="10vh"
  >
    <template #header>
      <div class="code-editor-header">
        <div class="header-info">
          <h3 class="header-title">{{ file.name }}</h3>
          <p class="header-path">{{ file.path }}</p>
        </div>
        <div class="header-actions">
          <t-button variant="text" size="small" :title="'下载'" @click="handleDownload">
            <template #icon>
              <t-icon name="download" />
            </template>
          </t-button>
          <t-button :variant="saveSuccess ? 'outline' : 'base'" :loading="saving" @click="handleSave">
            <template #icon>
              <t-icon v-if="saveSuccess" name="check" />
              <t-icon v-else name="save" />
            </template>
            {{ saveSuccess ? '已保存' : saving ? '保存中...' : '保存' }}
          </t-button>
        </div>
      </div>
    </template>

    <div class="code-editor-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载 {{ file.name }}...</div>
      </div>

      <!-- 编辑器 -->
      <div v-else class="editor-container">
        <textarea ref="editorRef" v-model="content" class="editor-textarea" spellcheck="false"></textarea>
      </div>
    </div>

    <template #footer>
      <div class="code-editor-footer">
        <div class="footer-stats">
          <span>行数: {{ lineCount }}</span>
          <span>字符数: {{ characterCount }}</span>
        </div>
        <div class="footer-shortcuts">快捷键: Ctrl+S 保存, Esc 关闭</div>
      </div>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { SelectedFile } from '../types/file'
import { fileApi } from '../api'

const props = defineProps<{ file: SelectedFile }>()

const emit = defineEmits<{ close: [] }>()

const content = ref('')
const loading = ref(true)
const saving = ref(false)
const saveSuccess = ref(false)
const editorRef = ref<HTMLTextAreaElement | null>(null)

// 统计信息
const lineCount = computed(() => content.value.split('\n').length)
const characterCount = computed(() => content.value.length)

// 加载文件内容
const loadFileContent = async () => {
  loading.value = true
  try {
    // 如果有 diffInfo，直接使用新内容
    if (props.file.diffInfo?.new_string !== undefined) {
      content.value = props.file.diffInfo.new_string
      loading.value = false
      return
    }

    const data = await fileApi.readFile(props.file.projectName, props.file.path)
    content.value = data.content
  } catch (error) {
    console.error('加载文件失败:', error)
    content.value = `// 加载文件失败: ${error}\n// 文件: ${props.file.name}\n// 路径: ${props.file.path}`
  } finally {
    loading.value = false
  }
}

// 保存文件
const handleSave = async () => {
  saving.value = true
  try {
    await fileApi.saveFile(props.file.projectName, props.file.path, content.value)
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('保存文件失败:', error)
    alert(`保存文件失败: ${error}`)
  } finally {
    saving.value = false
  }
}

// 下载文件
const handleDownload = () => {
  const blob = new Blob([content.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = props.file.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 关闭编辑器
const handleClose = () => {
  emit('close')
}

// 键盘快捷键处理
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    handleClose()
  }
}

onMounted(() => {
  loadFileContent()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听文件变化，重新加载
watch(
  () => props.file.path,
  () => {
    loadFileContent()
  },
)
</script>

<style scoped lang="scss">
.code-editor-dialog {
  :deep(.t-dialog) {
    max-width: 95vw;
    height: 90vh;
  }

  :deep(.t-dialog__body) {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.code-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-path {
  margin: 0;
  font-size: 14px;
  color: var(--td-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.code-editor-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 70vh;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--td-border-level-2-color);
  border-top-color: var(--td-brand-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: var(--td-text-color-primary);
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  padding: 16px;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  background-color: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  tab-size: 2;

  &::placeholder {
    color: var(--td-text-color-placeholder);
  }
}

.code-editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--td-border-level-1-color);
  background-color: var(--td-bg-color-container);
}

.footer-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.footer-shortcuts {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}
</style>
