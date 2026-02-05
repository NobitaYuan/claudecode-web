import { authenticatedFetch, CCServerBaseUrl } from '@/api/api'
import type { FileItem } from '../types/file'

/**
 * 文件相关 API
 */
export const fileApi = {
  /**
   * 获取项目文件列表
   */
  async getFiles(projectName: string): Promise<FileItem[]> {
    const response = await authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/files`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 文件获取失败:', response.status, errorText)
      throw new Error(`获取文件失败: ${response.status}`)
    }

    return response.json()
  },

  /**
   * 读取文件内容
   */
  async readFile(projectName: string, filePath: string): Promise<{ content: string }> {
    const response = await authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/file?filePath=${encodeURIComponent(filePath)}`)

    if (!response.ok) {
      throw new Error(`读取文件失败: ${response.status}`)
    }

    return response.json()
  },

  /**
   * 保存文件内容
   */
  async saveFile(projectName: string, filePath: string, content: string): Promise<void> {
    const response = await authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/file`, {
      method: 'PUT',
      body: JSON.stringify({ filePath, content }),
    })

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const errorData = await response.json()
        throw new Error(errorData.error || `保存失败: ${response.status}`)
      } else {
        throw new Error(`保存失败: ${response.status}`)
      }
    }
  },

  /**
   * 获取文件内容（用于图片等二进制文件）
   */
  async getFileContent(projectName: string, filePath: string): Promise<Blob> {
    const response = await authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/files/content?path=${encodeURIComponent(filePath)}`)

    if (!response.ok) {
      throw new Error(`获取文件内容失败: ${response.status}`)
    }

    return response.blob()
  },
}
