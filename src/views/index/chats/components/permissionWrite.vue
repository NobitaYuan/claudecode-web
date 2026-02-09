<script lang="ts" setup>
import { useClaudePermission } from '../../hooks/useClaudePermission'
import { claudePermissionRequest } from '../../hooks/useWebSocket'
import { MessageResponse } from '@/components/ai-elements/message'
const emit = defineEmits(['sendAnswer'])
// https://code.claude.com/docs/zh-CN/hooks#permissionrequest-%E5%86%B3%E7%AD%96%E6%8E%A7%E5%88%B6
const { claudePermissionMap, cancelPermission } = useClaudePermission()

/*
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
// 是否有提问
const hasQuestion = computed(() => {
  let has = false
  if (!claudePermissionMap.value.size) return false
  claudePermissionMap.value.forEach((item) => {
    // 没被取消
    if (item.isCancel) {
      has = false
      return
    }
    if (item.toolName === 'Write' && item.input.command) {
      has = true
    }
  })
  return has
})

// 当前的请求
const curRequest = computed(() => {
  if (!hasQuestion.value) return null
  let q: claudePermissionRequest
  claudePermissionMap.value.forEach((item) => {
    if (item.toolName === 'Write') {
      q = item
    }
  })
  return q
})

const sendAnswer = (allow: boolean = true) => {
  emit('sendAnswer', {
    type: 'claude-permission-response',
    requestId: curRequest.value.requestId,
    allow: allow ? 'allow' : 'deny',
  })
  cancelPermission(curRequest.value)
}
</script>

<template>
  <div class="permissionDecision bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" v-if="curRequest">
    <div class="text-[26px] mb-[12px]">文件写入：</div>
    <div class="md">
      <p>
        {{ curRequest?.input?.file_path }}
      </p>
      <MessageResponse :content="curRequest?.input?.content || '?'"> </MessageResponse>
    </div>
    <div class="mt-3 flex flex-wrap gap-2 justify-end">
      <button
        type="button"
        @click="sendAnswer(true)"
        class="inline-flex items-center gap-2 rounded-md bg-amber-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-amber-700 transition-colors"
      >
        同意
      </button>

      <button
        type="button"
        @click="sendAnswer(false)"
        class="inline-flex items-center gap-2 rounded-md text-xs font-medium px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/30 transition-colors"
      >
        拒绝
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.permissionDecision {
  position: absolute;
  width: 100%;
  max-height: 50vh;
  overflow: hidden;
  left: 0;
  top: 0;
  transform: translateY(-100%);
  display: flex;
  flex-direction: column;
  .md {
    flex: 1;
    overflow: auto;
  }
}
</style>
