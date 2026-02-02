<script setup lang="ts">
import { api } from '@/api/api'
import { Project } from '../types'

// ==================== 类型定义 ====================

interface GithubToken {
  id: number
  credential_name: string
  is_active: boolean
}

interface PathSuggestion {
  name: string
  path: string
  type: 'file' | 'folder'
}

interface BrowserFolder extends PathSuggestion {}

interface CredentialResponse {
  credentials: GithubToken[]
}

interface FilesystemResponse {
  path: string
  suggestions: PathSuggestion[]
}

interface CreateFolderResponse {
  path: string
  error?: string
}

interface CreateWorkspaceResponse {
  project: Project
  error?: string
  details?: string
}

interface CloneProgressData {
  type: 'progress' | 'complete' | 'error'
  message?: string
  project?: Project
}

// ==================== Emits ====================

const emit = defineEmits<{
  close: []
  created: [project: Project]
}>()

const onClose = () => {
  emit('close')
}
const onProjectCreated = (data: Project) => {
  emit('created', data)
}

// ==================== 状态管理 ====================

// 向导状态：控制当前处于哪个步骤
const step = ref<number>(1)
const workspaceType = ref<'existing' | 'new'>('existing')

// 表单状态：存储用户输入的数据
const workspacePath = ref<string>('')
const githubUrl = ref<string>('')
const selectedGithubToken = ref<string>('')
const tokenMode = ref<'stored' | 'new' | 'none'>('stored')
const newGithubToken = ref<string>('')

// UI 状态：控制界面元素的显示和交互状态
const isCreating = ref<boolean>(false)
const error = ref<string | null>(null)
const availableTokens = ref<GithubToken[]>([])
const loadingTokens = ref<boolean>(false)
const pathSuggestions = ref<PathSuggestion[]>([])
const showPathDropdown = ref<boolean>(false)
const showFolderBrowser = ref<boolean>(false)
const browserCurrentPath = ref<string>('~')
const browserFolders = ref<BrowserFolder[]>([])
const loadingFolders = ref<boolean>(false)
const showHiddenFolders = ref<boolean>(false)
const showNewFolderInput = ref<boolean>(false)
const newFolderName = ref<string>('')
const creatingFolder = ref<boolean>(false)
const cloneProgress = ref<string>('')

// ==================== 计算属性 ====================
// 以下是根据状态计算得出的派生数据
// 过滤和排序文件夹列表：隐藏以 . 开头的文件夹（除非用户选择显示），并按名称排序
const filteredAndSortedFolders = computed((): BrowserFolder[] => {
  return browserFolders.value
    .filter((folder: BrowserFolder) => showHiddenFolders.value || !folder.name.startsWith('.'))
    .sort((a: BrowserFolder, b: BrowserFolder) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
})

// Methods
/**
 * 加载用户已保存的 GitHub 令牌
 * 从服务器获取凭证列表，过滤出激活状态的令牌，并自动选中第一个
 */
const loadGithubTokens = async (): Promise<void> => {
  try {
    loadingTokens.value = true
    const response = await api.get('/settings/credentials?type=github_token')
    const data: CredentialResponse = await response.json()

    const activeTokens = (data.credentials || []).filter((t: GithubToken) => t.is_active)
    availableTokens.value = activeTokens

    if (activeTokens.length > 0 && !selectedGithubToken.value) {
      selectedGithubToken.value = activeTokens[0].id.toString()
    }
  } catch (err) {
    console.error('Error loading GitHub tokens:', err)
  } finally {
    loadingTokens.value = false
  }
}

/**
 * 加载路径建议
 * 根据用户输入的路径，从父目录获取匹配的路径建议
 * @param inputPath - 用户输入的路径
 */
const loadPathSuggestions = async (inputPath: string): Promise<void> => {
  try {
    // 提取父目录路径：找到最后一个 / 的位置，截取前面的部分作为父目录
    const lastSlash = inputPath.lastIndexOf('/')
    const dirPath = lastSlash > 0 ? inputPath.substring(0, lastSlash) : '~'

    const response = await api.browseFilesystem(dirPath)
    const data: FilesystemResponse = await response.json()

    if (data.suggestions) {
      // 过滤出以用户输入开头的路径（不区分大小写），并排除用户当前输入的精确匹配
      const filtered = data.suggestions.filter(
        (s: PathSuggestion) => s.path.toLowerCase().startsWith(inputPath.toLowerCase()) && s.path.toLowerCase() !== inputPath.toLowerCase(),
      )
      // 只显示前 5 个建议
      pathSuggestions.value = filtered.slice(0, 5)
      showPathDropdown.value = filtered.length > 0
    }
  } catch (err) {
    console.error('Error loading path suggestions:', err)
  }
}

/**
 * 处理向导的"下一步"操作
 * 在进入下一步之前验证当前步骤的必填项
 */
const handleNext = (): void => {
  error.value = null

  if (step.value === 1) {
    // 步骤1：验证是否选择了工作区类型
    if (!workspaceType.value) {
      error.value = '请选择工作区类型'
      return
    }
    step.value = 2
  } else if (step.value === 2) {
    // 步骤2：验证是否输入了工作区路径
    if (!workspacePath.value.trim()) {
      error.value = '请提供工作区路径'
      return
    }
    step.value = 3
  }
}

/**
 * 处理向导的"上一步"操作
 * 清除错误信息并返回上一步
 */
const handleBack = (): void => {
  error.value = null
  step.value = step.value - 1
}

/**
 * 创建工作区或克隆 GitHub 仓库
 * 1. 如果是新工作区且提供了 GitHub URL，则克隆仓库（使用 SSE 监听进度）
 * 2. 否则，直接创建本地工作区
 */
const handleCreate = async (): Promise<void> => {
  isCreating.value = true
  error.value = null
  cloneProgress.value = ''

  try {
    // 场景1: 从 GitHub 克隆新仓库
    if (workspaceType.value === 'new' && githubUrl.value) {
      const params = new URLSearchParams({
        path: workspacePath.value.trim(),
        githubUrl: githubUrl.value.trim(),
      })

      // 根据选择的认证方式添加相应的令牌参数
      if (tokenMode.value === 'stored' && selectedGithubToken.value) {
        params.append('githubTokenId', selectedGithubToken.value)
      } else if (tokenMode.value === 'new' && newGithubToken.value) {
        params.append('newGithubToken', newGithubToken.value.trim())
      }

      const token = localStorage.getItem('auth-token')
      const url = `/api/projects/clone-progress?${params}${token ? `&token=${token}` : ''}`

      // 使用 EventSource (SSE) 监听克隆进度
      await new Promise((resolve, reject) => {
        const eventSource = new EventSource(url)

        eventSource.onmessage = (event: MessageEvent) => {
          try {
            const data: CloneProgressData = JSON.parse(event.data)

            if (data.type === 'progress') {
              // 更新克隆进度信息
              cloneProgress.value = data.message || ''
            } else if (data.type === 'complete') {
              // 克隆完成，关闭连接并触发成功回调
              eventSource.close()
              if (data.project) {
                onProjectCreated(data.project)
              }

              onClose()
              resolve(1)
            } else if (data.type === 'error') {
              // 克隆失败
              eventSource.close()
              reject(new Error(data.message || 'Unknown error'))
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e)
          }
        }

        eventSource.onerror = () => {
          eventSource.close()
          reject(new Error('Connection lost during clone'))
        }
      })
      return
    }

    // 场景2: 创建本地工作区（不克隆）
    const payload = {
      workspaceType: workspaceType.value,
      path: workspacePath.value.trim(),
    }

    const response = await api.createWorkspace(payload)
    const data: CreateWorkspaceResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.details || data.error || '创建工作区失败')
    }

    onProjectCreated(data.project)
    onClose()
  } catch (err) {
    console.error('Error creating workspace:', err)
    error.value = (err as Error).message || '创建工作区失败'
  } finally {
    isCreating.value = false
  }
}

/**
 * 选择路径建议
 * 将选中的建议填入路径输入框，并隐藏建议列表
 */
const selectPathSuggestion = (suggestion: PathSuggestion): void => {
  workspacePath.value = suggestion.path
  showPathDropdown.value = false
}

/**
 * 打开文件夹浏览器
 * 显示文件夹浏览器模态框，并从用户主目录开始加载
 */
const openFolderBrowser = async (): Promise<void> => {
  showFolderBrowser.value = true
  await loadBrowserFolders('~')
}

/**
 * 加载指定路径下的文件夹列表
 * @param path - 要浏览的路径
 */
const loadBrowserFolders = async (path: string): Promise<void> => {
  try {
    loadingFolders.value = true
    const response = await api.browseFilesystem(path)
    const data: FilesystemResponse = await response.json()
    browserCurrentPath.value = data.path || path
    browserFolders.value = data.suggestions || []
  } catch (err) {
    console.error('Error loading folders:', err)
  } finally {
    loadingFolders.value = false
  }
}

/**
 * 选择文件夹
 * @param folderPath - 选中的文件夹路径
 * @param advanceToConfirm - 是否直接跳转到确认步骤（用于现有工作区）
 */
const selectFolder = (folderPath: string, advanceToConfirm: boolean = false): void => {
  workspacePath.value = folderPath
  showFolderBrowser.value = false
  // 如果是现有工作区模式，直接跳到确认步骤
  if (advanceToConfirm) {
    step.value = 3
  }
}

/**
 * 导航到指定文件夹
 * 在文件夹浏览器中打开指定路径
 */
const navigateToFolder = async (folderPath: string): Promise<void> => {
  await loadBrowserFolders(folderPath)
}

/**
 * 导航到父目录
 * 支持 Unix (/) 和 Windows (\) 两种路径分隔符
 * 特别处理 Windows 盘符路径（如 C:\）
 */
const navigateToParentFolder = (): void => {
  // 找到最后一个路径分隔符的位置（支持 / 和 \）
  const lastSlash = Math.max(browserCurrentPath.value.lastIndexOf('/'), browserCurrentPath.value.lastIndexOf('\\'))
  let parentPath: string
  if (lastSlash <= 0) {
    // 已经到达根目录
    parentPath = '/'
  } else if (lastSlash === 2 && /^[A-Za-z]:/.test(browserCurrentPath.value)) {
    // Windows 盘符路径（如 C:\），截取到盘符冒号
    parentPath = browserCurrentPath.value.substring(0, 3)
  } else {
    // 常规情况：截取到最后一个分隔符之前的部分
    parentPath = browserCurrentPath.value.substring(0, lastSlash)
  }
  navigateToFolder(parentPath)
}

/**
 * 在当前路径下创建新文件夹
 * 自动检测路径分隔符（Windows 用 \，Unix 用 /）
 * 创建成功后刷新文件夹列表并显示新创建的文件夹
 */
const createNewFolder = async (): Promise<void> => {
  if (!newFolderName.value.trim()) return
  creatingFolder.value = true
  error.value = null
  try {
    // 根据当前路径判断使用哪种路径分隔符
    const separator = browserCurrentPath.value.includes('\\') ? '\\' : '/'
    const folderPath = `${browserCurrentPath.value}${separator}${newFolderName.value.trim()}`
    const response = await api.createFolder(folderPath)
    const data: CreateFolderResponse = await response.json()
    if (!response.ok) {
      throw new Error(data.error || '创建文件夹失败')
    }
    // 清空输入框并隐藏输入框
    newFolderName.value = ''
    showNewFolderInput.value = false
    // 刷新文件夹列表，定位到新创建的文件夹
    await loadBrowserFolders(data.path || folderPath)
  } catch (err) {
    console.error('Error creating folder:', err)
    error.value = (err as Error).message || '创建文件夹失败'
  } finally {
    creatingFolder.value = false
  }
}

// ==================== 监听器 ====================
// 自动响应用户操作并触发相应的逻辑
// 监听步骤、工作区类型和 GitHub URL 的变化
// 当用户在步骤2选择了新工作区并输入了 GitHub URL 时，自动加载可用的令牌
watch(
  () => [step.value, workspaceType.value, githubUrl.value] as const,
  () => {
    if (step.value === 2 && workspaceType.value === 'new' && githubUrl.value) {
      loadGithubTokens()
    }
  },
)

// 监听工作区路径输入
// 当路径长度超过2个字符时，自动加载路径建议供用户选择
watch(workspacePath, (newPath: string) => {
  if (newPath.length > 2) {
    loadPathSuggestions(newPath)
  } else {
    // 路径太短时清空建议
    pathSuggestions.value = []
    showPathDropdown.value = false
  }
})
</script>
<template>
  <div class="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-0 sm:p-4">
    <div
      class="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl border-0 sm:border border-gray-200 dark:border-gray-700 overflow-y-auto"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <t-icon name="folder-add" class="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">创建新项目</h3>
        </div>
        <button
          @click="onClose"
          class="px-1 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          :disabled="isCreating"
        >
          <t-icon name="close" />
        </button>
      </div>

      <!-- Progress Indicator -->
      <div class="px-6 pt-4 pb-2">
        <div class="flex items-center justify-between">
          <template v-for="s in [1, 2, 3]" :key="s">
            <div class="flex items-center gap-2">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm',
                  s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500',
                ]"
              >
                <t-icon v-if="s < step" name="check" />
                <span v-else>{{ s }}</span>
              </div>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                {{ s === 1 ? '选择类型' : s === 2 ? '配置' : '确认' }}
              </span>
            </div>
            <div v-if="s < 3" :class="['flex-1 h-1 mx-2 rounded', s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700']" />
          </template>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6 min-h-[300px]">
        <!-- Error Display -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <t-icon name="error-circle" class="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
          </div>
        </div>

        <!-- Step 1: Choose workspace type -->
        <div v-if="step === 1" class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">您想如何创建工作区？</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Existing Workspace -->
              <button
                @click="workspaceType = 'existing'"
                :class="[
                  'p-4 border-2 rounded-lg text-left transition-all',
                  workspaceType === 'existing'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                ]"
              >
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <t-icon name="folder-add" class="text-green-600 dark:text-green-400" />
                  </div>
                  <div class="flex-1">
                    <h5 class="font-semibold text-gray-900 dark:text-white mb-1">打开现有工作区</h5>
                    <p class="text-sm text-gray-600 dark:text-gray-400">选择计算机上已存在的项目文件夹</p>
                  </div>
                </div>
              </button>

              <!-- New Workspace -->
              <button
                @click="workspaceType = 'new'"
                :class="[
                  'p-4 border-2 rounded-lg text-left transition-all',
                  workspaceType === 'new'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                ]"
              >
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <t-icon name="logo-github" class="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div class="flex-1">
                    <h5 class="font-semibold text-gray-900 dark:text-white mb-1">创建新工作区</h5>
                    <p class="text-sm text-gray-600 dark:text-gray-400">从 GitHub 克隆仓库或创建新的空白工作区</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Configure workspace -->
        <div v-if="step === 2" class="space-y-4">
          <!-- Workspace Path -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ workspaceType === 'existing' ? '工作区路径' : '新工作区路径' }}
            </label>
            <div class="relative flex gap-2">
              <div class="flex-1 relative">
                <t-input
                  v-model="workspacePath"
                  :placeholder="workspaceType === 'existing' ? '/path/to/existing/workspace' : '/path/to/new/workspace'"
                  class="w-full"
                />
                <div
                  v-if="showPathDropdown && pathSuggestions.length > 0"
                  class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  <button
                    v-for="(suggestion, index) in pathSuggestions"
                    :key="index"
                    @click="selectPathSuggestion(suggestion)"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  >
                    <div class="font-medium text-gray-900 dark:text-white">{{ suggestion.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ suggestion.path }}</div>
                  </button>
                </div>
              </div>
              <t-button variant="outline" @click="openFolderBrowser" class="px-3" title="浏览文件夹">
                <t-icon name="folder-open" />
              </t-button>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ workspaceType === 'existing' ? '输入现有项目文件夹的完整路径' : '输入要创建新工作区的路径' }}
            </p>
          </div>

          <!-- GitHub URL (only for new workspace) -->
          <template v-if="workspaceType === 'new'">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> GitHub 仓库 URL </label>
              <t-input v-model="githubUrl" placeholder="https://github.com/username/repository" class="w-full" />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">输入要克隆的 GitHub 仓库 URL</p>
            </div>

            <!-- GitHub Token (only for HTTPS URLs - SSH uses SSH keys) -->
            <div
              v-if="githubUrl && !githubUrl.startsWith('git@') && !githubUrl.startsWith('ssh://')"
              class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-start gap-3 mb-4">
                <t-icon name="lock-on" class="text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <h5 class="font-medium text-gray-900 dark:text-white mb-1">GitHub 认证</h5>
                  <p class="text-sm text-gray-600 dark:text-gray-400">如果是私有仓库，您需要提供 GitHub 个人访问令牌</p>
                </div>
              </div>

              <div v-if="loadingTokens" class="flex items-center gap-2 text-sm text-gray-500">
                <t-icon name="loading" class="animate-spin" />
                加载令牌中...
              </div>

              <template v-else-if="availableTokens.length > 0">
                <!-- Token Selection Tabs -->
                <div class="grid grid-cols-3 gap-2 mb-4">
                  <button
                    @click="tokenMode = 'stored'"
                    :class="[
                      'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      tokenMode === 'stored' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                    ]"
                  >
                    使用已存储令牌
                  </button>
                  <button
                    @click="tokenMode = 'new'"
                    :class="[
                      'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      tokenMode === 'new' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                    ]"
                  >
                    使用新令牌
                  </button>
                  <button
                    @click="
                      () => {
                        tokenMode = 'none'
                        selectedGithubToken = ''
                        newGithubToken = ''
                      }
                    "
                    :class="[
                      'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      tokenMode === 'none' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                    ]"
                  >
                    无需令牌（公开仓库）
                  </button>
                </div>

                <div v-if="tokenMode === 'stored'">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> 选择令牌 </label>
                  <select
                    v-model="selectedGithubToken"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  >
                    <option value="">选择一个令牌</option>
                    <option v-for="token in availableTokens" :key="token.id" :value="token.id">
                      {{ token.credential_name }}
                    </option>
                  </select>
                </div>

                <div v-else-if="tokenMode === 'new'">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> 新 GitHub 令牌 </label>
                  <t-input v-model="newGithubToken" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" class="w-full" />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">令牌需要 repo 权限才能访问私有仓库</p>
                </div>
              </template>

              <div v-else class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <p class="text-sm text-blue-800 dark:text-blue-200">这是公开仓库，通常不需要认证。但提供令牌可以避免 GitHub 的速率限制。</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> GitHub 令牌（可选） </label>
                  <t-input v-model="newGithubToken" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" class="w-full" />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">没有存储的令牌？您可以输入一个新的令牌（可选）</p>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Step 3: Confirm -->
        <div v-if="step === 3" class="space-y-4">
          <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">查看配置</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">工作区类型</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ workspaceType === 'existing' ? '现有工作区' : '新工作区' }}
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">路径</span>
                <span class="font-mono text-xs text-gray-900 dark:text-white break-all">
                  {{ workspacePath }}
                </span>
              </div>
              <template v-if="workspaceType === 'new' && githubUrl">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">克隆来源</span>
                  <span class="font-mono text-xs text-gray-900 dark:text-white break-all">
                    {{ githubUrl }}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">认证方式</span>
                  <span class="text-xs text-gray-900 dark:text-white">
                    {{
                      tokenMode === 'stored' && selectedGithubToken
                        ? `使用已存储令牌: ${availableTokens.find((t) => t.id.toString() === selectedGithubToken)?.credential_name || '未知'}`
                        : tokenMode === 'new' && newGithubToken
                          ? '使用提供的令牌'
                          : githubUrl.startsWith('git@') || githubUrl.startsWith('ssh://')
                            ? 'SSH 密钥'
                            : '无认证'
                    }}
                  </span>
                </div>
              </template>
            </div>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div v-if="isCreating && cloneProgress" class="space-y-2">
              <p class="text-sm font-medium text-blue-800 dark:text-blue-200">正在克隆仓库...</p>
              <code class="block text-xs font-mono text-blue-700 dark:text-blue-300 whitespace-pre-wrap break-all">
                {{ cloneProgress }}
              </code>
            </div>
            <p v-else class="text-sm text-blue-800 dark:text-blue-200">
              {{
                workspaceType === 'existing'
                  ? '将打开现有的工作区。确保目录包含有效的项目文件。'
                  : githubUrl
                    ? '将从 GitHub 克隆仓库到指定路径，然后创建新工作区。'
                    : '将在指定路径创建新的空白工作区。'
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
        <t-button variant="outline" @click="step === 1 ? onClose() : handleBack()" :disabled="isCreating">
          <template v-if="step === 1"> 取消 </template>
          <template v-else>
            <t-icon name="chevron-left" class="mr-1 mt-1" />
            上一步
          </template>
        </t-button>

        <t-button @click="step === 3 ? handleCreate() : handleNext()" :disabled="isCreating || (step === 1 && !workspaceType)" :loading="isCreating">
          <template v-if="isCreating">
            {{ githubUrl ? '正在克隆...' : '创建中' }}
          </template>
          <template v-else-if="step === 3">
            <t-icon name="check" class="mr-1 mt-1" />
            创建项目
          </template>
          <template v-else>
            下一步
            <t-icon name="chevron-right" class="ml-1 mt-1" />
          </template>
        </t-button>
      </div>
    </div>

    <!-- Folder Browser Modal -->
    <div v-if="showFolderBrowser" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] border border-gray-200 dark:border-gray-700 flex flex-col">
        <!-- Browser Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <t-icon name="folder-open" class="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">选择文件夹</h3>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="showHiddenFolders = !showHiddenFolders"
              :class="[
                'p-2 rounded-md transition-colors',
                showHiddenFolders
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
              ]"
              :title="showHiddenFolders ? '隐藏隐藏文件夹' : '显示隐藏文件夹'"
            >
              <t-icon :name="showHiddenFolders ? 'browse' : 'browse-off'" />
            </button>
            <button
              @click="showNewFolderInput = !showNewFolderInput"
              :class="[
                'p-2 rounded-md transition-colors',
                showNewFolderInput
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
              ]"
              title="创建新文件夹"
            >
              <t-icon name="add" />
            </button>
            <button
              @click="showFolderBrowser = false"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <t-icon name="close" />
            </button>
          </div>
        </div>

        <!-- New Folder Input -->
        <div v-if="showNewFolderInput" class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <div class="flex items-center gap-2">
            <t-input
              v-model="newFolderName"
              placeholder="新文件夹名称"
              class="flex-1"
              @keyup.enter="createNewFolder()"
              @keyup.escape="
                () => {
                  showNewFolderInput = false
                  newFolderName = ''
                }
              "
              autofocus
            />
            <t-button size="small" @click="createNewFolder()" :disabled="!newFolderName.trim() || creatingFolder">
              <t-icon v-if="creatingFolder" name="loading" class="animate-spin" />
              <span v-else>创建</span>
            </t-button>
            <t-button
              size="small"
              @click="
                () => {
                  showNewFolderInput = false
                  newFolderName = ''
                }
              "
            >
              取消
            </t-button>
          </div>
        </div>

        <!-- Folder List -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="loadingFolders" class="flex items-center justify-center py-8">
            <t-icon name="loading" size="6" class="animate-spin text-gray-400" />
          </div>
          <div v-else class="space-y-1">
            <!-- Parent Directory -->
            <button
              v-if="browserCurrentPath !== '~' && browserCurrentPath !== '/' && !/^[A-Za-z]:\\?$/.test(browserCurrentPath)"
              @click="navigateToParentFolder()"
              class="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3"
            >
              <t-icon name="folder-open" class="text-gray-400" />
              <span class="font-medium text-gray-700 dark:text-gray-300">..</span>
            </button>

            <!-- Folders -->
            <div v-if="browserFolders.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">未找到子文件夹</div>
            <div v-for="folder in filteredAndSortedFolders" :key="folder.path" class="flex items-center gap-2">
              <button
                @click="navigateToFolder(folder.path)"
                class="flex-1 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3"
              >
                <t-icon name="folder-add" class="text-blue-500" />
                <span class="font-medium text-gray-900 dark:text-white">{{ folder.name }}</span>
              </button>
              <t-button size="small" theme="primary" variant="outline" @click="selectFolder(folder.path, workspaceType === 'existing')" class="text-xs px-3">
                选择
              </t-button>
            </div>
          </div>
        </div>

        <!-- Browser Footer with Current Path -->
        <div class="border-t border-gray-200 dark:border-gray-700">
          <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">路径:</span>
            <code class="text-sm font-mono text-gray-900 dark:text-white flex-1 truncate">
              {{ browserCurrentPath }}
            </code>
          </div>
          <div class="flex items-center justify-end gap-2 p-4">
            <t-button
              variant="outline"
              @click="
                () => {
                  showFolderBrowser = false
                  showNewFolderInput = false
                  newFolderName = ''
                }
              "
            >
              取消
            </t-button>
            <t-button variant="outline" @click="selectFolder(browserCurrentPath, workspaceType === 'existing')"> 使用此文件夹 </t-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
