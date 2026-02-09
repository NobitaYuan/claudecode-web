import { computed } from 'vue'
import { useClaudePermission } from '../../hooks/useClaudePermission'
import { claudePermissionRequest } from '../../hooks/useWebSocket'

/**
 * 权限响应选项
 */
export interface PermissionResponseOptions {
  message?: string
  updatedInput?: any
  rememberEntry?: string
}

/**
 * 权限工具 Composable
 *
 * 封装所有权限组件的通用逻辑，包括：
 * - 获取所有未取消的权限请求
 * - 发送权限响应
 *
 * @param emit - Vue emit 函数，用于发送 sendAnswer 事件
 * @returns 权限工具的状态和操作方法
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePermissionTool } from '../../hooks/usePermissionTool'
 * const emit = defineEmits(['sendAnswer'])
 * const { pendingRequests, sendAnswer } = usePermissionTool(emit)
 *
 * // 处理 Bash 请求
 * const bashRequests = computed(() =>
 *   pendingRequests.value.filter(r => r.toolName === 'Bash')
 * )
 * </script>
 * ```
 */
export function usePermissionTool(emit: (event: 'sendAnswer', data: any) => void) {
  const { claudePermissionMap, cancelPermission } = useClaudePermission()

  // 获取所有未取消的权限请求，按时间顺序排序（旧的在前）
  const pendingRequests = computed(() => {
    const requests: claudePermissionRequest[] = []
    claudePermissionMap.value.forEach((item) => {
      if (!item.isCancel) {
        requests.push(item)
      }
    })
    return requests
  })

  // 发送响应
  const sendAnswer = (requestId: string, allow: boolean, options: PermissionResponseOptions = {}) => {
    const request = claudePermissionMap.value.get(requestId)
    if (!request) return

    const response: any = {
      type: 'claude-permission-response',
      requestId,
      allow,
    }

    if (allow && options.updatedInput) {
      response.updatedInput = options.updatedInput
    }
    // 添加可选字段
    if (!allow) {
      response.message = options.message || '用户拒绝！'
      response.interrupt = true
    }
    if (options.rememberEntry) {
      response.rememberEntry = options.rememberEntry
    }

    emit('sendAnswer', response)
    cancelPermission(request)
  }

  return {
    pendingRequests,
    sendAnswer,
    cancelPermission,
  }
}

/* 
数据示例：
{
    "type": "claude-permission-request",
    "requestId": "1b7262f8-5d13-4a8a-9ac9-6b516b2ee1fc",
    "toolName": "AskUserQuestion",
    "input": {
        "questions": [
            {
                "question": "这个 todolist 需要持久化存储数据吗？（比如存储到 localStorage）",
                "header": "数据存储",
                "options": [
                    {
                        "label": "需要 localStorage 持久化",
                        "description": "刷新页面后数据仍然保留"
                    },
                    {
                        "label": "仅内存存储",
                        "description": "刷新页面后数据清空，简单实现"
                    }
                ],
                "multiSelect": false
            },
            {
                "question": "你希望 todolist 包含哪些功能？",
                "header": "功能范围",
                "options": [
                    {
                        "label": "添加任务",
                        "description": "输入框添加新的待办事项"
                    },
                    {
                        "label": "删除任务",
                        "description": "可以删除单个任务"
                    },
                    {
                        "label": "标记完成",
                        "description": "点击切换任务的完成状态"
                    },
                    {
                        "label": "清空已完成",
                        "description": "一键清除所有已完成的任务"
                    }
                ],
                "multiSelect": true
            }
        ]
    },
    "sessionId": "b77e62a4-1636-4f8b-907e-cfca82750eb0"
}
————————————————————————————————
{
    "type": "claude-permission-request",
    "requestId": "15754b73-79f3-4985-9a28-5a02cadac448",
    "toolName": "Bash",
    "input": {
        "command": "cat /proc/version 2>/dev/null || systeminfo | findstr /C:\"OS\"",
        "description": "Check OS version"
    },
    "sessionId": "b8b2b65d-a034-4c20-b5de-6cda3e3d8ed7"
}
————————————————————————————————
{
    "type": "claude-permission-request",
    "requestId": "75c1d73a-b5c2-4fdd-ba10-5c661e0ee2ad",
    "toolName": "ExitPlanMode",
    "input": {
        "plan": "# 缩小 questionSelecterDialog 组件尺寸计划\r\n\r\n## 问题分析\r\n\r\n当前组件的尺寸问题：\r\n- **外层容器**：`p-4` (16px padding) 较大\r\n- **图标**：`w-8 h-8` (32px) 和 `w-5 h-5` (20px) 较大\r\n- **标题**：`text-base` (16px) 较大\r\n- **Tab 按钮**：`px-4 py-2` (16px 8px) 较大\r\n- **选项卡片**：`p-4` (16px padding) 间距过大\r\n- **选项文字**：`text-base` (16px) 和 `text-sm` (14px) 较大\r\n- **按钮**：`px-4 py-2.5` (16px 10px) 和 `w-5 h-5` 图标较大\r\n- **间距**：`gap-3` (12px)、`mb-3` (12px)、`mb-4` (16px) 等间距较大\r\n\r\n## 优化目标\r\n\r\n在保持良好的可读性和可点击性的前提下，整体缩小组件尺寸约 20-30%，使其更紧凑。\r\n\r\n## 具体修改方案\r\n\r\n### 文件位置\r\n**主文件**：`d:\\coding\\claudeCodeOnWeb\\src\\views\\index\\chats\\components\\questionSelecterDialog.vue`\r\n\r\n### 修改清单\r\n\r\n#### 1. 外层容器（第 140 行）\r\n**当前**：`class=\"questionSelecterDialog bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4\"`\r\n\r\n**修改为**：将 `p-4` 改为 `p-3`\r\n```vue\r\n<div v-if=\"hasQuestion\" class=\"questionSelecterDialog bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3\">\r\n```\r\n\r\n#### 2. 图标容器（第 142 行）\r\n**当前**：`class=\"w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5\"`\r\n\r\n**修改为**：将 `w-8 h-8` 改为 `w-6 h-6`\r\n```vue\r\n<div class=\"w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5\">\r\n```\r\n\r\n#### 3. SVG 图标大小（第 143 行）\r\n**当前**：`class=\"w-5 h-5 text-white\"`\r\n\r\n**修改为**：将 `w-5 h-5` 改为 `w-4 h-4`\r\n```vue\r\n<svg class=\"w-4 h-4 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\r\n```\r\n\r\n#### 4. 主标题（第 153 行）\r\n**当前**：`<h4 class=\"font-semibold text-amber-900 dark:text-amber-100 text-base mb-3\">交互提示</h4>`\r\n\r\n**修改为**：将 `text-base mb-3` 改为 `text-sm mb-2`\r\n```vue\r\n<h4 class=\"font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2\">交互提示</h4>\r\n```\r\n\r\n#### 5. Tab 切换栏容器（第 156 行）\r\n**当前**：`<div v-if=\"question.length > 1\" class=\"mb-4\">`\r\n\r\n**修改为**：将 `mb-4` 改为 `mb-3`\r\n```vue\r\n<div v-if=\"question.length > 1\" class=\"mb-3\">\r\n```\r\n\r\n#### 6. Tab 切换栏按钮（第 164 行）\r\n**当前**：`'px-4 py-2 rounded-t-lg text-sm font-medium transition-all'`\r\n\r\n**修改为**：将 `px-4 py-2` 改为 `px-3 py-1.5 text-xs`\r\n```vue\r\n:class=\"[\r\n  'px-3 py-1.5 rounded-t text-xs font-medium transition-all',\r\n  ...\r\n]\"\r\n```\r\n\r\n#### 7. Tab 切换栏按钮间距（第 157 行）\r\n**当前**：`<div class=\"flex flex-wrap gap-2 border-b border-amber-300 dark:border-amber-700 pb-2\">`\r\n\r\n**修改为**：将 `gap-2 pb-2` 改为 `gap-1.5 pb-1.5`\r\n```vue\r\n<div class=\"flex flex-wrap gap-1.5 border-b border-amber-300 dark:border-amber-700 pb-1.5\">\r\n```\r\n\r\n#### 8. 当前问题文本容器（第 176 行）\r\n**当前**：`<div class=\"mb-3\">`\r\n\r\n**修改为**：将 `mb-3` 改为 `mb-2`\r\n```vue\r\n<div class=\"mb-2\">\r\n```\r\n\r\n#### 9. 当前问题文本（第 177 行）\r\n**当前**：`class=\"text-amber-900 dark:text-amber-100 font-medium text-base\"`\r\n\r\n**修改为**：将 `text-base` 改为 `text-sm`\r\n```vue\r\n<p v-if=\"currentQuestion.question\" class=\"text-amber-900 dark:text-amber-100 font-medium text-sm\">\r\n```\r\n\r\n#### 10. 当前问题多选提示（第 179 行）\r\n**当前**：`<span v-if=\"currentQuestion.multiSelect\" class=\"text-sm\">（多选）</span>`\r\n\r\n**修改为**：将 `text-sm` 改为 `text-xs`\r\n```vue\r\n<span v-if=\"currentQuestion.multiSelect\" class=\"text-xs\">（多选）</span>\r\n```\r\n\r\n#### 11. 选项按钮列表容器（第 185 行）\r\n**当前**：`<div class=\"space-y-3 mb-4\">`\r\n\r\n**修改为**：将 `space-y-3 mb-4` 改为 `space-y-2 mb-3`\r\n```vue\r\n<div class=\"space-y-2 mb-3\">\r\n```\r\n\r\n#### 12. 选项卡片（第 186-195 行）\r\n**当前**：\r\n```vue\r\n:class=\"[\r\n  'p-4 rounded-lg border-2 transition-all cursor-pointer',\r\n  ...\r\n]\"\r\n```\r\n\r\n**修改为**：将 `p-4` 改为 `p-2.5`\r\n```vue\r\n:class=\"[\r\n  'p-2.5 rounded-lg border-2 transition-all cursor-pointer',\r\n  ...\r\n]\"\r\n```\r\n\r\n#### 13. 选项卡片内间距（第 197 行）\r\n**当前**：`<div class=\"flex items-start gap-3\">`\r\n\r\n**修改为**：将 `gap-3` 改为 `gap-2`\r\n```vue\r\n<div class=\"flex items-start gap-2\">\r\n```\r\n\r\n#### 14. 选项指示器（第 200-204 行）\r\n**当前**：\r\n```vue\r\n:class=\"[\r\n  'w-5 h-5 rounded border-2 flex items-center justify-center',\r\n  ...\r\n]\"\r\n```\r\n\r\n**修改为**：将 `w-5 h-5` 改为 `w-4 h-4`\r\n```vue\r\n:class=\"[\r\n  'w-4 h-4 rounded border-2 flex items-center justify-center',\r\n  ...\r\n]\"\r\n```\r\n\r\n#### 15. 选项勾选图标（第 206 行）\r\n**当前**：`class=\"w-3.5 h-3.5 text-white\"`\r\n\r\n**修改为**：将 `w-3.5 h-3.5` 改为 `w-3 h-3`\r\n```vue\r\n<svg v-if=\"isOptionSelected(index)\" class=\"w-3 h-3 text-white\" fill=\"currentColor\" viewBox=\"0 0 20 20\">\r\n```\r\n\r\n#### 16. 选项标题（第 218 行）\r\n**当前**：`<div class=\"font-semibold text-base mb-1\">`\r\n\r\n**修改为**：将 `text-base` 改为 `text-sm`\r\n```vue\r\n<div class=\"font-semibold text-sm mb-1\">\r\n```\r\n\r\n#### 17. 选项描述（第 221 行）\r\n**当前**：`<div v-if=\"option.description\" class=\"text-sm opacity-90\">`\r\n\r\n**修改为**：将 `text-sm` 改为 `text-xs`\r\n```vue\r\n<div v-if=\"option.description\" class=\"text-xs opacity-90\">\r\n```\r\n\r\n#### 18. 提交和拒绝按钮容器（第 230 行）\r\n**当前**：`<div class=\"flex gap-3 mt-4 pt-4 border-t border-amber-300 dark:border-amber-700\">`\r\n\r\n**修改为**：将 `gap-3 mt-4 pt-4` 改为 `gap-2 mt-3 pt-3`\r\n```vue\r\n<div class=\"flex gap-2 mt-3 pt-3 border-t border-amber-300 dark:border-amber-700\">\r\n```\r\n\r\n#### 19. 提交按钮（第 231-239 行）\r\n**当前**：\r\n```vue\r\n<button\r\n  @click=\"sendAnswer(true)\"\r\n  class=\"flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2\"\r\n>\r\n  <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\r\n```\r\n\r\n**修改为**：将 `px-4 py-2.5` 改为 `px-3 py-2`，`w-5 h-5` 改为 `w-4 h-4`，`gap-2` 改为 `gap-1.5`\r\n```vue\r\n<button\r\n  @click=\"sendAnswer(true)\"\r\n  class=\"flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 text-sm\"\r\n>\r\n  <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\r\n```\r\n\r\n#### 20. 取消按钮（第 240-248 行）\r\n**当前**：\r\n```vue\r\n<button\r\n  @click=\"handleReject\"\r\n  class=\"flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2\"\r\n>\r\n  <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\r\n```\r\n\r\n**修改为**：将 `px-4 py-2.5` 改为 `px-3 py-2`，`w-5 h-5` 改为 `w-4 h-4`，`gap-2` 改为 `gap-1.5`\r\n```vue\r\n<button\r\n  @click=\"handleReject\"\r\n  class=\"flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 text-sm\"\r\n>\r\n  <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\r\n```\r\n\r\n#### 21. 主容器内间距（第 141 行）\r\n**当前**：`<div class=\"flex items-start gap-3\">`\r\n\r\n**修改为**：将 `gap-3` 改为 `gap-2`\r\n```vue\r\n<div class=\"flex items-start gap-2\">\r\n```\r\n\r\n## 修改总结\r\n\r\n### 尺寸变化对比\r\n| 元素 | 修改前 | 修改后 | 缩小比例 |\r\n|------|--------|--------|----------|\r\n| 外层 padding | p-4 (16px) | p-3 (12px) | -25% |\r\n| 主图标 | w-8 h-8 (32px) | w-6 h-6 (24px) | -25% |\r\n| SVG 图标 | w-5 h-5 (20px) | w-4 h-4 (16px) | -20% |\r\n| 标题文字 | text-base (16px) | text-sm (14px) | -12.5% |\r\n| Tab 按钮 | px-4 py-2 (16px 8px) | px-3 py-1.5 (12px 6px) | -25% |\r\n| Tab 文字 | text-sm (14px) | text-xs (12px) | -14% |\r\n| 选项卡片 padding | p-4 (16px) | p-2.5 (10px) | -37.5% |\r\n| 选项标题 | text-base (16px) | text-sm (14px) | -12.5% |\r\n| 选项描述 | text-sm (14px) | text-xs (12px) | -14% |\r\n| 按钮内边距 | py-2.5 (10px) | py-2 (8px) | -20% |\r\n| 按钮文字 | 默认 (16px) | text-sm (14px) | -12.5% |\r\n| 各类间距 | gap-3/mb-4 (12px/16px) | gap-2/mb-3 (8px/12px) | -33%/-25% |\r\n\r\n### 预期效果\r\n- **整体高度**：预计减少约 25-30%\r\n- **视觉密度**：更紧凑，信息密度更高\r\n- **可读性**：仍保持良好（最小文字 12px）\r\n- **可点击性**：按钮仍符合最小点击区域（44px 高度）\r\n\r\n## 验证步骤\r\n\r\n### 1. 功能测试\r\n- [ ] 组件正常显示\r\n- [ ] Tab 切换正常工作\r\n- [ ] 选项选择功能正常\r\n- [ ] 提交和取消按钮功能正常\r\n- [ ] 深色模式显示正常\r\n\r\n### 2. 视觉测试\r\n- [ ] 整体尺寸明显缩小\r\n- [ ] 文字清晰可读\r\n- [ ] 图标大小合适\r\n- [ ] 间距协调统一\r\n- [ ] 与其他组件比例协调\r\n\r\n### 3. 交互测试\r\n- [ ] 鼠标悬停效果正常\r\n- [ ] 点击响应正常\r\n- [ ] 移动端触摸友好\r\n- [ ] 动画流畅\r\n\r\n## 注意事项\r\n\r\n1. **保持可访问性**：确保缩小后的尺寸仍符合 WCAG 可访问性标准\r\n2. **保持一致性**：检查是否需要同步调整其他相关组件（如 todoList）\r\n3. **测试不同内容**：测试不同长度的问题文本和选项数量\r\n4. **响应式**：确保在不同屏幕尺寸下表现良好\r\n\r\n## 实施顺序\r\n\r\n按行号顺序依次修改：\r\n1. 第 140 行：外层容器 p-4 → p-3\r\n2. 第 141 行：主容器间距 gap-3 → gap-2\r\n3. 第 142-143 行：图标容器和图标尺寸\r\n4. 第 153 行：标题文字\r\n5. 第 156-172 行：Tab 切换栏\r\n6. 第 176-182 行：问题文本\r\n7. 第 185-226 行：选项卡片列表\r\n8. 第 230-248 行：提交和取消按钮\r\n\r\n**预计工作量**：约 10-15 分钟\r\n"
    },
    "sessionId": "7c7ba73a-2086-48ce-9624-b796f4a66a68"
}
————————————————————————————————
{
    "type": "claude-permission-request",
    "requestId": "7cb9a8f9-e18e-49b5-9603-e42bc47e0b4a",
    "toolName": "Edit",
    "input": {
        "file_path": "d:\\coding\\claudecodeWebServer\\database\\db.js",
        "old_string": "const runMigrations = () => {\n  try {\n    const tableInfo = db.prepare(\"PRAGMA table_info(users)\").all();\n    const columnNames = tableInfo.map(col => col.name);\n\n    if (!columnNames.includes('git_name')) {\n      console.log('Running migration: Adding git_name column');\n      db.exec('ALTER TABLE users ADD COLUMN git_name TEXT');\n    }\n\n    if (!columnNames.includes('git_email')) {\n      console.log('Running migration: Adding git_email column');\n      db.exec('ALTER TABLE users ADD COLUMN git_email TEXT');\n    }\n\n    if (!columnNames.includes('has_completed_onboarding')) {\n      console.log('Running migration: Adding has_completed_onboarding column');\n      db.exec('ALTER TABLE users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT 0');\n    }\n\n    console.log('Database migrations completed successfully');\n  } catch (error) {\n    console.error('Error running migrations:', error.message);\n    throw error;\n  }\n};",
        "new_string": "const runMigrations = () => {\n  try {\n    const tableInfo = db.prepare(\"PRAGMA table_info(users)\").all();\n    const columnNames = tableInfo.map(col => col.name);\n\n    if (!columnNames.includes('git_name')) {\n      console.log('Running migration: Adding git_name column');\n      db.exec('ALTER TABLE users ADD COLUMN git_name TEXT');\n    }\n\n    if (!columnNames.includes('git_email')) {\n      console.log('Running migration: Adding git_email column');\n      db.exec('ALTER TABLE users ADD COLUMN git_email TEXT');\n    }\n\n    if (!columnNames.includes('has_completed_onboarding')) {\n      console.log('Running migration: Adding has_completed_onboarding column');\n      db.exec('ALTER TABLE users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT 0');\n    }\n\n    // TodoList migration - check if todo tables exist\n    const todoTables = db.prepare(\n      \"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('todos', 'todo_categories', 'todo_subtasks')\"\n    ).all();\n\n    if (todoTables.length < 3) {\n      console.log('Running migration: Creating todo tables');\n\n      // Create todo_categories table\n      db.exec(`\n        CREATE TABLE IF NOT EXISTS todo_categories (\n          id INTEGER PRIMARY KEY AUTOINCREMENT,\n          name TEXT UNIQUE NOT NULL,\n          color TEXT DEFAULT '#3B82F6',\n          icon TEXT DEFAULT '📝',\n          display_order INTEGER DEFAULT 0,\n          created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n        );\n        CREATE INDEX IF NOT EXISTS idx_todo_categories_name ON todo_categories(name);\n      `);\n\n      // Create todos table\n      db.exec(`\n        CREATE TABLE IF NOT EXISTS todos (\n          id INTEGER PRIMARY KEY AUTOINCREMENT,\n          user_id INTEGER NOT NULL,\n          title TEXT NOT NULL,\n          description TEXT,\n          category_id INTEGER,\n          priority TEXT DEFAULT 'medium',\n          status TEXT DEFAULT 'pending',\n          due_date DATETIME,\n          completed_at DATETIME,\n          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,\n          FOREIGN KEY (category_id) REFERENCES todo_categories(id) ON DELETE SET NULL\n        );\n        CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);\n        CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);\n        CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);\n        CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);\n        CREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos(category_id);\n        CREATE INDEX IF NOT EXISTS idx_todos_user_status ON todos(user_id, status);\n      `);\n\n      // Create todo_subtasks table\n      db.exec(`\n        CREATE TABLE IF NOT EXISTS todo_subtasks (\n          id INTEGER PRIMARY KEY AUTOINCREMENT,\n          todo_id INTEGER NOT NULL,\n          title TEXT NOT NULL,\n          is_completed BOOLEAN DEFAULT 0,\n          display_order INTEGER DEFAULT 0,\n          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n          completed_at DATETIME,\n          FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE\n        );\n        CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON todo_subtasks(todo_id);\n        CREATE INDEX IF NOT EXISTS idx_subtasks_order ON todo_subtasks(todo_id, display_order);\n      `);\n\n      // Seed categories\n      const categoryCount = db.prepare('SELECT COUNT(*) as count FROM todo_categories').get();\n      if (categoryCount.count === 0) {\n        db.prepare('INSERT INTO todo_categories (name, color, icon, display_order) VALUES (?, ?, ?, ?)').run('work', '#3B82F6', '💼', 0);\n        db.prepare('INSERT INTO todo_categories (name, color, icon, display_order) VALUES (?, ?, ?, ?)').run('life', '#10B981', '🏠', 1);\n        db.prepare('INSERT INTO todo_categories (name, color, icon, display_order) VALUES (?, ?, ?, ?)').run('study', '#F59E0B', '📚', 2);\n        console.log('Seeded initial todo categories');\n      }\n    }\n\n    console.log('Database migrations completed successfully');\n  } catch (error) {\n    console.error('Error running migrations:', error.message);\n    throw error;\n  }\n};",
        "replace_all": false
    },
    "sessionId": "436921d3-c214-456c-86b0-900108d371e2"
}
————————————————————————————————
{
    "type": "claude-permission-request",
    "requestId": "2ad190e2-f029-4728-92f3-9e138e1f4b7c",
    "toolName": "Write",
    "input": {
        "file_path": "d:\\coding\\claudecodeWebServer\\database\\migrations\\todolist.sql",
        "content": "-- TodoList Migration SQL\n-- Creates tables for the todolist feature\n\n-- Categories table (fixed: work, life, study)\nCREATE TABLE IF NOT EXISTS todo_categories (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    name TEXT UNIQUE NOT NULL,\n    color TEXT DEFAULT '#3B82F6',\n    icon TEXT DEFAULT '📝',\n    display_order INTEGER DEFAULT 0,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Todos table\nCREATE TABLE IF NOT EXISTS todos (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    user_id INTEGER NOT NULL,\n    title TEXT NOT NULL,\n    description TEXT,\n    category_id INTEGER,\n    priority TEXT DEFAULT 'medium',\n    status TEXT DEFAULT 'pending',\n    due_date DATETIME,\n    completed_at DATETIME,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,\n    FOREIGN KEY (category_id) REFERENCES todo_categories(id) ON DELETE SET NULL\n);\n\n-- Subtasks table\nCREATE TABLE IF NOT EXISTS todo_subtasks (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    todo_id INTEGER NOT NULL,\n    title TEXT NOT NULL,\n    is_completed BOOLEAN DEFAULT 0,\n    display_order INTEGER DEFAULT 0,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n    completed_at DATETIME,\n    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE\n);\n\n-- Performance indexes for categories\nCREATE INDEX IF NOT EXISTS idx_todo_categories_name ON todo_categories(name);\n\n-- Performance indexes for todos\nCREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);\nCREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);\nCREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);\nCREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);\nCREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos(category_id);\nCREATE INDEX IF NOT EXISTS idx_todos_user_status ON todos(user_id, status);\n\n-- Performance indexes for subtasks\nCREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON todo_subtasks(todo_id);\nCREATE INDEX IF NOT EXISTS idx_subtasks_order ON todo_subtasks(todo_id, display_order);\n\n-- Seed initial categories\nINSERT OR IGNORE INTO todo_categories (name, color, icon, display_order) VALUES\n    ('work', '#3B82F6', '💼', 0),\n    ('life', '#10B981', '🏠', 1),\n    ('study', '#F59E0B', '📚', 2);\n"
    },
    "sessionId": "436921d3-c214-456c-86b0-900108d371e2"
}
*/
