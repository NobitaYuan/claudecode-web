/**
 * Claude Code UI - 消息类型定义
 *
 * 定义了 convertSessionMessages() 函数转换后的所有消息类型
 */

/**
 * 基础消息接口
 */
interface BaseMessage {
  /** 消息类型 */
  type: 'user' | 'assistant' | 'error' | 'tool'
  /** 消息时间戳 */
  timestamp: string
}

/**
 * 用户消息
 */
export interface UserMessage extends BaseMessage {
  type: 'user'
  /** 用户输入的文本内容 */
  content: string
  /** 可选：图片附件 */
  images?: Array<{
    data: string // base64 编码的图片数据
    name: string // 图片文件名
  }>
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  /** 执行结果内容 */
  content: string
  /** 是否为错误结果 */
  isError: boolean
  /** 可选：结构化的工具结果数据（用于 Grep、Glob 等） */
  toolUseResult?: {
    filenames?: string[] // 文件列表（用于 Grep/Glob）
    numFiles?: number // 文件数量
    [key: string]: any // 其他结构化数据
  }
  /** 结果时间戳 */
  timestamp?: Date
}

/**
 * AI 助手消息（普通文本响应）
 */
export interface AssistantMessage extends BaseMessage {
  type: 'assistant'
  /** AI 响应内容（Markdown 格式） */
  content: string
  /** 可选：思考过程（某些模型提供的推理过程） */
  reasoning?: string
  /** 可选：标记为思考中消息 */
  isThinking?: true
}

/**
 * 工具调用消息（assistant 类型）
 */
export interface ToolUseMessage extends BaseMessage {
  type: 'assistant'
  /** 工具调用时 content 为空字符串 */
  content: ''
  /** 标记为工具调用 */
  isToolUse: true
  /** 工具名称 */
  toolName: string
  /** 工具输入（JSON 字符串） */
  toolInput: string
  /** 工具调用 ID */
  toolId: string
  /** 可选：工具调用 ID（Codex 使用） */
  toolCallId?: string
  /** 可选：工具执行结果 */
  toolResult?: ToolResult
  /** 可选：工具是否出错 */
  toolError?: boolean
  /** 可选：工具结果时间戳 */
  toolResultTimestamp?: Date
}

/**
 * 思考消息（Codex reasoning）
 */
export interface ThinkingMessage extends BaseMessage {
  type: 'assistant'
  /** 思考内容 */
  content: string
  /** 标记为思考中 */
  isThinking: true
}

/**
 * 交互式提示消息
 */
export interface InteractivePromptMessage extends BaseMessage {
  type: 'assistant'
  /** 提示内容（包含问题文本） */
  content: string
  /** 标记为交互式提示 */
  isInteractivePrompt: true
}

/**
 * 错误消息
 */
export interface ErrorMessage extends BaseMessage {
  type: 'error'
  /** 错误信息 */
  content: string
}

/**
 * 所有消息类型的扁平化合并类型
 *
 * 将所有消息类型的字段合并到一个类型中，特定字段标记为可选
 * 使用时不需要类型收窄，可以直接访问任意字段
 */
export interface Message {
  /** 消息类型 */
  type: BaseMessage['type']
  /** 消息时间戳 */
  timestamp: string | Date

  // === 用户消息字段 ===
  /** 用户输入的文本内容 */
  content?: string
  /** 可选：图片附件（用户消息） */
  images?: Array<{
    data: string // base64 编码的图片数据
    name: string // 图片文件名
  }>

  // === AI 助手消息字段 ===
  /** 思考过程（某些模型提供的推理过程） */
  reasoning?: string
  /** 标记为思考中消息 */
  isThinking?: true
  /** 标记为工具调用 */
  isToolUse?: true
  /** 工具名称 */
  toolName?: string
  /** 工具输入（JSON 字符串） */
  toolInput?: string
  /** 工具调用 ID */
  toolId?: string
  /** 工具调用 ID（Codex 使用） */
  toolCallId?: string
  /** 工具执行结果 */
  toolResult?: ToolResult
  /** 工具是否出错 */
  toolError?: boolean
  /** 工具结果时间戳 */
  toolResultTimestamp?: Date
  /** 标记为交互式提示 */
  isInteractivePrompt?: true
}

/**
 * 工具名称类型
 */
export type ToolName = 'Read' | 'Write' | 'Edit' | 'Bash' | 'Grep' | 'Glob' | 'TodoWrite' | 'TodoRead' | 'exit_plan_mode' | 'ApplyPatch' | string // 允许其他工具名称

/**
 * AI 提供商类型
 */
export type Provider = 'claude' | 'cursor' | 'codex'

/**
 * 消息类型
 */
export type MessageType = 'user' | 'assistant' | 'error' | 'tool'

/**
 * 原始会话消息（来自 WebSocket 或 JSONL 文件）
 */
export interface RawSessionMessage {
  /** 消息时间戳 */
  timestamp?: string
  /** 消息类型（某些格式使用） */
  type?: string
  /** 工具名称（tool_use 类型） */
  toolName?: string
  /** 工具输入（tool_use 类型） */
  toolInput?: string
  /** 工具调用 ID（Codex 使用） */
  toolCallId?: string
  /** 工具使用结果数据 */
  toolUseResult?: ToolResult['toolUseResult']
  /** 消息内容 */
  message?: {
    /** 消息角色 */
    role: 'user' | 'assistant' | 'system'
    /** 消息内容（可以是字符串或数组） */
    content:
      | {
          type: 'text' | 'tool_use' | 'tool_result' | 'image'
          text?: string
          name?: string
          id?: string
          input?: any
          is_error?: boolean
          content?: any
          source?: {
            type: string
            media_type?: string
            data?: string
          }
        }[]
      | string
  }
}

/**
 * 工具输入解析后的类型
 */
export interface ParsedToolInput {
  pattern?: string
  path?: string
  file_path?: string
  old_string?: string
  new_string?: string
  content?: string
  command?: string
  description?: string
  todos?: Array<{
    id: string
    content: string
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  }>
  plan?: string
  [key: string]: any
}

/**
 * Diff 行类型
 */
export interface DiffLine {
  type: 'removed' | 'added'
  content: string
  lineNum: number
}

/**
 * 权限建议类型
 */
export interface PermissionSuggestion {
  toolName: string
  entry: string
  isAllowed: boolean
}

/**
 * 交互式提示选项类型
 */
export interface InteractivePromptOption {
  number: string
  text: string
  isSelected: boolean
}

/**
 * 编辑工具输入类型
 */
export interface EditToolInput {
  file_path: string
  old_string: string
  new_string: string
}

/**
 * 写入工具输入类型
 */
export interface WriteToolInput {
  file_path: string
  content: string
}

/**
 * Bash 工具输入类型
 */
export interface BashToolInput {
  command: string
  description?: string
}

/**
 * TodoWrite 工具输入类型
 */
export interface TodoWriteToolInput {
  todos: Array<{
    id: string
    content: string
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  }>
}

/**
 * Read 工具输入类型
 */
export interface ReadToolInput {
  file_path: string
}

/**
 * exit_plan_mode 工具输入类型
 */
export interface ExitPlanToolInput {
  plan: string
}

/**
 * 工具输入类型映射
 */
export interface ToolInputMap {
  Edit: EditToolInput
  Write: WriteToolInput
  Bash: BashToolInput
  TodoWrite: TodoWriteToolInput
  Read: ReadToolInput
  exit_plan_mode: ExitPlanToolInput
  Grep: ParsedToolInput
  Glob: ParsedToolInput
}
