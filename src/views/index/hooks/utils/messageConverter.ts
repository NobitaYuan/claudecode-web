/**
 * convertSessionMessages 函数的 TypeScript 实现示例
 *
 * 这个文件展示了如何使用 TypeScript 类型定义来实现消息转换函数
 */

import type { RawSessionMessage, Message, UserMessage, AssistantMessage, ToolUseMessage, ToolResult, ThinkingMessage } from './message'

/**
 * HTML 实体解码
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return text
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * 保护数学公式的同时进行反转义
 */
function unescapeWithMathProtection(text: string): string {
  // TODO: 实现数学公式保护逻辑
  return text
}

/**
 * 将原始会话消息转换为统一的消息格式
 *
 * @param rawMessages - 原始会话消息数组（来自 WebSocket 或 JSONL 文件）
 * @returns 转换后的消息数组
 */
export const convertSessionMessages = (rawMessages: RawSessionMessage[]): Message[] => {
  const converted: Message[] = []
  const toolResults = new Map<string, ToolResult>()

  // ============================================================
  // 第一遍遍历：收集所有工具结果
  // ============================================================
  for (const msg of rawMessages) {
    if (msg.message?.role === 'user' && Array.isArray(msg.message?.content)) {
      for (const part of msg.message.content) {
        if (part.type === 'tool_result') {
          toolResults.set(part.id!, {
            content: typeof part.content === 'string' ? part.content : JSON.stringify(part.content),
            isError: part.is_error || false,
            timestamp: new Date(msg.timestamp || Date.now()),
            toolUseResult: msg.toolUseResult || undefined,
          })
        }
      }
    }
  }

  // ============================================================
  // 第二遍遍历：处理消息并附加工具结果
  // ============================================================
  for (const msg of rawMessages) {
    // --------------------------------------------------------
    // 处理用户消息
    // --------------------------------------------------------
    if (msg.message?.role === 'user' && msg.message?.content) {
      let content = ''

      if (Array.isArray(msg.message.content)) {
        // 处理数组内容（跳过 tool_result）
        const textParts = msg.message.content.filter((part) => part.type === 'text').map((part) => decodeHtmlEntities(part.text || ''))

        content = textParts.join('\n')
      } else if (typeof msg.message.content === 'string') {
        content = decodeHtmlEntities(msg.message.content)
      } else {
        content = decodeHtmlEntities(String(msg.message.content))
      }

      // 过滤系统消息和命令消息
      const shouldSkip =
        !content ||
        content.startsWith('<command-name>') ||
        content.startsWith('<command-message>') ||
        content.startsWith('<command-args>') ||
        content.startsWith('<local-command-stdout>') ||
        content.startsWith('<system-reminder>') ||
        content.startsWith('Caveat:') ||
        content.startsWith('This session is being continued') ||
        content.startsWith('[Request interrupted')

      if (!shouldSkip) {
        content = unescapeWithMathProtection(content)
        converted.push({
          uuid: msg.uuid,
          type: 'user',
          content,
          timestamp: msg.timestamp || new Date().toISOString(),
        } as UserMessage)
      }
    }

    // --------------------------------------------------------
    // 处理思考消息（Codex reasoning）
    // --------------------------------------------------------
    else if (msg.type === 'thinking' && msg.message?.content) {
      converted.push({
        uuid: msg.uuid,
        type: 'assistant',
        content: unescapeWithMathProtection(msg.message.content as string),
        timestamp: msg.timestamp || new Date().toISOString(),
        isThinking: true,
      } as ThinkingMessage)
    }

    // --------------------------------------------------------
    // 处理工具调用消息（Codex function calls）
    // --------------------------------------------------------
    else if (msg.type === 'tool_use' && msg.toolName) {
      converted.push({
        uuid: msg.uuid,
        type: 'assistant',
        content: '',
        timestamp: msg.timestamp || new Date().toISOString(),
        isToolUse: true,
        toolName: msg.toolName,
        toolInput: msg.toolInput || '',
        toolId: msg.toolCallId || '',
        toolCallId: msg.toolCallId,
      } as ToolUseMessage)
    }

    // --------------------------------------------------------
    // 处理工具结果消息（Codex function outputs）
    // --------------------------------------------------------
    else if (msg.type === 'tool_result') {
      // 找到对应的 tool_use 并附加结果
      for (let i = converted.length - 1; i >= 0; i--) {
        const message = converted[i]
        if (isToolUseMessage(message) && !message.toolResult) {
          if (!msg.toolCallId || message.toolCallId === msg.toolCallId) {
            message.toolResult = {
              content: msg.output || '',
              isError: false,
            }
            break
          }
        }
      }
    }

    // --------------------------------------------------------
    // 处理 AI 助手消息
    // --------------------------------------------------------
    else if (msg.message?.role === 'assistant' && msg.message?.content) {
      if (Array.isArray(msg.message.content)) {
        for (const part of msg.message.content) {
          // 处理文本部分
          if (part.type === 'text') {
            let text = part.text || ''
            text = unescapeWithMathProtection(text)

            converted.push({
              uuid: msg.uuid,
              type: 'assistant',
              content: text,
              timestamp: msg.timestamp || new Date().toISOString(),
            } as AssistantMessage)
          }

          // 处理工具调用部分
          else if (part.type === 'tool_use') {
            const toolResult = toolResults.get(part.id!)

            converted.push({
              uuid: msg.uuid,
              type: 'assistant',
              content: '',
              timestamp: msg.timestamp || new Date().toISOString(),
              isToolUse: true,
              toolName: part.name,
              toolInput: JSON.stringify(part.input),
              toolId: part.id,
              toolResult: toolResult
                ? {
                    content: typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content),
                    isError: toolResult.isError,
                    toolUseResult: toolResult.toolUseResult,
                  }
                : undefined,
              toolError: toolResult?.isError || false,
              toolResultTimestamp: toolResult?.timestamp || new Date(),
            } as ToolUseMessage)
          }
        }
      } else if (typeof msg.message.content === 'string') {
        let text = msg.message.content
        text = unescapeWithMathProtection(text)

        converted.push({
          uuid: msg.uuid,
          type: 'assistant',
          content: text,
          timestamp: msg.timestamp || new Date().toISOString(),
        } as AssistantMessage)
      }
    }
  }

  return converted
}

/**
 * 类型守卫：判断是否为工具调用消息
 */
function isToolUseMessage(message: Message): message is ToolUseMessage {
  return message.type === 'assistant' && 'isToolUse' in message && (message as ToolUseMessage).isToolUse === true
}
