/**
 * 文件树共享逻辑 Composable
 */

import { ref, type Ref } from 'vue'
import type { FileItem } from '../types/file'
import { fileApi } from '../api'

export function useFileTree(projectName: Ref<string>) {
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs']
  const docExtensions = ['md', 'txt', 'doc', 'pdf']
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp']
  const files = ref<FileItem[]>([])
  const loading = ref(false)

  /**
   * 获取文件列表
   */
  const fetchFiles = async () => {
    if (!projectName.value) return

    loading.value = true
    try {
      files.value = await fileApi.getFiles(projectName.value)
    } catch (error) {
      console.error('获取文件失败:', error)
      files.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 递归过滤文件和目录
   */
  const filterFiles = (items: FileItem[], query: string): FileItem[] => {
    return items.reduce((filtered: FileItem[], item) => {
      const matchesName = item.name.toLowerCase().includes(query.toLowerCase())
      let filteredChildren: FileItem[] = []

      if (item.type === 'directory' && item.children) {
        filteredChildren = filterFiles(item.children, query)
      }

      // 如果文件名匹配或者是包含匹配子项的目录，则保留
      if (matchesName || filteredChildren.length > 0) {
        filtered.push({
          ...item,
          children: filteredChildren,
        })
      }

      return filtered
    }, [])
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  /**
   * 格式化相对时间（中文）
   */
  const formatRelativeTime = (date?: string): string => {
    if (!date) return '-'

    const now = new Date()
    const past = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (diffInSeconds < 60) return '刚刚'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`

    return past.toLocaleDateString('zh-CN')
  }

  /**
   * 判断是否为图片文件
   */
  const isImageFile = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase()
    return imageExtensions.includes(ext || '')
  }

  /**
   * 获取文件图标名称
   */
  const getFileIconName = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()

    if (codeExtensions.includes(ext || '')) return 'code'
    if (docExtensions.includes(ext || '')) return 'file-1'
    if (imageExtensions.includes(ext || '')) return 'image'
    return 'file-1'
  }

  /**
   * 获取文件图标名称
   */
  const getFileIconClor = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()

    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs']
    const docExtensions = ['md', 'txt', 'doc', 'pdf']
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp']

    if (codeExtensions.includes(ext || '')) return 'var(--td-success-color)'
    if (docExtensions.includes(ext || '')) return 'var(--td-brand-color)'
    if (imageExtensions.includes(ext || '')) return 'var(--td-warning-color)'
    return ''
  }

  return {
    files,
    loading,
    fetchFiles,
    filterFiles,
    formatFileSize,
    formatRelativeTime,
    isImageFile,
    getFileIconName,
    getFileIconClor,
  }
}
