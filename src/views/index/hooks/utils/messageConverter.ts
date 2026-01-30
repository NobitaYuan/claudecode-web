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
  const userToolResults = new Map<string, ToolResult>()

  // ============================================================
  // 第一遍遍历：收集所有用户消息的工具结果
  // ============================================================
  for (const msg of rawMessages) {
    if (msg.message?.role === 'user' && Array.isArray(msg.message?.content)) {
      for (const part of msg.message.content) {
        if (part.type === 'tool_result') {
          userToolResults.set(part.tool_use_id!, {
            content: typeof part.content === 'string' ? part.content : JSON.stringify(part.content),
            isError: part.is_error || false,
            timestamp: new Date(msg.timestamp || Date.now()),
            toolUseResult: msg.toolUseResult || undefined,
          })
        }
      }
    }
  }
  // console.log('userToolResults', userToolResults)

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
        // console.log('msg.message.content', msg.message.content)
        // 处理数组内容（跳过 tool_result）
        const textParts = msg.message.content
          .filter((part) => part.type === 'text') // || part.type === 'tool_result'
          .map((part) => {
            // if (part.type === 'tool_result' && typeof part.content === 'string') {
            //   return part.content || ''
            // } else {
            // }
            return decodeHtmlEntities(part.text || '')
          })

        content = textParts.join('\n')
      } else if (typeof msg.message.content === 'string') {
        content = decodeHtmlEntities(msg.message.content)
      } else {
        content = decodeHtmlEntities(String(msg.message.content))
      }
      // console.log('content', content)
      // 过滤系统消息和命令消息
      const shouldSkip =
        !content ||
        content.startsWith('<command-name>') ||
        content.startsWith('<command-message>') ||
        content.startsWith('<command-args>') ||
        content.startsWith('<local-command-stdout>') ||
        content.startsWith('<system-reminder>') ||
        content.startsWith('Caveat:') ||
        content.startsWith('This session is being continued')
      // content.startsWith('[Request interrupted')

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
            const toolResult = userToolResults.get(part.id!)
            // console.log('toolResult', toolResult)
            // 交互式工具
            if (part.name === 'AskUserQuestion') {
              converted.push({
                uuid: msg.uuid,
                type: 'assistant',
                content: '',
                timestamp: msg.timestamp || new Date().toISOString(),
                isToolUse: true,
                isInteractivePrompt: part.name === 'AskUserQuestion', // 判断是否为交互式
                toolName: part.name,
                toolInput: JSON.stringify(part.input),
                toolId: part.tool_use_id,
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
            // 其他的工具
            else {
              converted.push({
                uuid: msg.uuid,
                type: 'assistant',
                content: '',
                timestamp: msg.timestamp || new Date().toISOString(),
                isToolUse: true,
                toolName: part.name,
                toolInput: JSON.stringify(part.input),
                toolId: part.tool_use_id,
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
          // 工具调用结果
          else if (part.type === 'tool_result') {
            const toolResult = userToolResults.get(part.tool_use_id!)
            converted.push({
              uuid: msg.uuid,
              type: 'assistant',
              content: '',
              timestamp: msg.timestamp || new Date().toISOString(),
              isToolUse: true,
              toolName: part.name,
              toolInput: JSON.stringify(part.input),
              toolId: part.tool_use_id,
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
          // 处理思考部分
          else if (part.type === 'thinking') {
            let text = part.thinking || ''
            text = unescapeWithMathProtection(text)
            converted.push({
              uuid: msg.uuid,
              type: 'assistant',
              content: text,
              timestamp: msg.timestamp || new Date().toISOString(),
              isThinking: true,
            } as ThinkingMessage)
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
