/**
 * 文件相关类型定义
 */

export interface FileItem {
  /** 文件/目录名称 */
  name: string
  /** 完整路径 */
  path: string
  /** 类型：文件或目录 */
  type: 'file' | 'directory'
  /** 文件大小（字节） */
  size?: number
  /** 修改时间 */
  modified?: string
  /** 权限（rwx 格式） */
  permissionsRwx?: string
  /** 子项（目录） */
  children?: FileItem[]
}

export type ViewMode = 'simple' | 'compact' | 'detailed'

export interface SelectedFile {
  /** 文件名 */
  name: string
  /** 文件路径 */
  path: string
  /** 项目路径 */
  projectPath: string
  /** 项目名称 */
  projectName: string
  /** Diff 信息（用于 CodeEditor） */
  diffInfo?: {
    old_string?: string
    new_string?: string
  }
}
