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
    if (item.toolName === 'Edit' && item.input.command) {
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
    if (item.toolName === 'Edit') {
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
    <div class="text-[26px] mb-[12px]">文件编辑：</div>
    <div class="md">
      <p>
        {{ curRequest?.input?.file_path }}
      </p>
      <MessageResponse :content="curRequest?.input?.new_string || '?'"> </MessageResponse>
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
