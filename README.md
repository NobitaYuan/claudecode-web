<h1 align="center">
  <a href="https://github.com/NobitaYuan/claudecode-on-web" target="_blank">Claude Code on Web</a>
</h1>

<div align="center">

一个功能完整的 Claude Code Web 客户端，提供现代化的 AI 编程助手体验

[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Rolldown-646cff?logo=vite)](https://vitejs.dev/)
<img src="./example.png" alt="example" width="100%">

</div>

---

## ✨ 特性

- 🤖 **AI 驱动的编程助手** - 基于 Claude API 的智能代码助手
- 💬 **实时对话** - WebSocket 支持的流式响应
- 🛠️ **工具调用支持** - 完整的工具使用和结果展示
- 📊 **可视化工具** - 图表、流程图等数据可视化
- 🎨 **现代化 UI** - 基于 TDesign 和 Tailwind CSS 的精美界面
- 🌐 **国际化** - 多语言支持（i18n）
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🎯 **类型安全** - 完整的 TypeScript 类型定义

---

## 🏗️ 技术栈

### 核心框架

- **Vue 3.5** - 渐进式 JavaScript 框架（Composition API）
- **TypeScript 5.8** - JavaScript 的超集
- **Vite (Rolldown)** - 下一代构建工具

### UI 框架

- **TDesign Vue Next** - 腾讯企业级设计体系
- **Tailwind CSS** - 原子化 CSS 框架
- **Lucide Vue Next** - 现代化图标库
- **Motion** - Vue 3 动画库

### 状态管理 & 路由

- **Pinia** - Vue 3 状态管理
- **Vue Router** - 官方路由管理器
- **Pinia Plugin Persistedstate** - 状态持久化

### AI & Markdown

- **@ai-sdk/vue** - Vercel AI SDK Vue 集成
- **ai** - Vercel AI Kit
- **vue-stream-markdown** - 流式 Markdown 渲染
- **Shiki** - 语法高亮

### 开发工具

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Husky** - Git hooks
- **Commitizen** - 规范化提交

---

## 📁 项目结构

```
src/
├── api/                      # API 接口层
│   ├── api.ts               # 统一的 API 请求封装
│   └── user/                # 用户相关 API
├── components/               # 组件库
│   ├── ai-elements/         # AI 功能组件
│   │   ├── artifact/        # 工件组件（代码展示等）
│   │   ├── canvas/          # 画布组件
│   │   ├── chain-of-thought/# 思维链组件
│   │   ├── conversation/    # 对话组件
│   │   ├── message/         # 消息组件
│   │   └── prompt-input/    # 输入组件
│   └── ui/                  # 基础 UI 组件
├── views/                    # 页面视图
│   ├── index/               # 主页
│   │   ├── chats/           # 聊天相关
│   │   ├── hooks/           # 业务 hooks
│   │   └── components/      # 页面级组件
│   ├── login/               # 登录页
│   └── error/               # 错误页
├── stores/                   # Pinia 状态管理
├── router/                   # 路由配置
├── utils/                    # 工具函数
├── types/                    # TypeScript 类型定义
├── i18n/                     # 国际化配置
└── layout/                   # 布局组件
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm（推荐）或 npm

### 安装依赖

```bash
# 使用 pnpm
pnpm install

# 或使用 npm
npm install
```

### 配置环境变量

复制对应环境的配置文件：

```bash
# 开发环境
cp .env.development .env.local

# 生产环境
cp .env.production .env.local
```

编辑 `.env.local` 配置后端服务地址：

```env
# 服务端接口地址
VITE_APP_BASE_API_URL = '/api'

# WebSocket 地址
VITE_APP_WS_URL = 'ws://localhost:3001'
```

### 启动开发服务器

```bash
# 开发模式
pnpm dev

# 或者
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用

### 构建生产版本

```bash
# 开发环境构建
pnpm build-dev

# 测试环境构建
pnpm build-test

# 生产环境构建
pnpm build-pro
```

---

## 📦 核心功能

### 1. AI 对话系统

- 实时流式响应
- 上下文管理
- 多轮对话支持
- 消息类型转换和过滤

### 2. 工具调用

- 工具使用展示
- 工具结果渲染
- 错误处理和重试

### 3. 项目管理

- 项目列表展示
- 会话管理
- 文件操作

### 4. 消息渲染

- Markdown 流式渲染
- 代码高亮
- 思维链展示
- 工件渲染

### 5. WebSocket 通信

- 实时消息推送
- 连接状态管理
- 自动重连机制

---

## 🔧 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码质量控制：

```bash
# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix
```

### Git 提交规范

使用 Commitizen 进行规范化提交：

```bash
# 添加暂存
git add .

# 提交（会触发交互式提交界面）
pnpm cz

# 或使用 git commit（会被 husky 拦截）
git commit -m "feat: 添加新功能"
```

提交类型：

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具变动

### 组件开发

项目使用组件自动导入，无需手动引入：

```vue
<script setup lang="ts">
// 组件会自动导入，直接使用即可
</script>

<template>
  <Button>Click me</Button>
  <Conversation>
    <ConversationContent>
      <!-- 对话内容 -->
    </ConversationContent>
  </Conversation>
</template>
```

### API 请求

统一的 API 封装：

```typescript
import { api } from '@/api/api'

// 获取项目列表
const projects = await api.getProjects()

// 创建会话
const session = await api.createSession(projectId)
```

---

## 🎯 核心组件说明

### Conversation 组件

对话容器组件，提供自动滚动功能：

```vue
<Conversation>
  <ConversationContent>
    <Message>消息内容</Message>
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>
```

### PromptInput 组件

输入框组件，支持多行输入和快捷键：

```vue
<PromptInput v-model="input" placeholder="输入你的问题..." @submit="handleSubmit" />
```

### Artifact 组件

工件展示组件，用于展示代码、图表等：

```vue
<Artifact :type="artifact.type" :content="artifact.content" />
```

---

## 🔐 环境变量说明

| 变量名                  | 说明         | 默认值                |
| ----------------------- | ------------ | --------------------- |
| `VITE_APP_TITLE`        | 页面标题     | `'claudecode-on-web'` |
| `VITE_APP_ENV`          | 当前环境     | `'development'`       |
| `VITE_APP_BASE_API_URL` | API 基础路径 | `'/api'`              |

---

## 📝 许可证

[MIT License](LICENSE)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](../../issues)
- 发起 [Discussion](../../discussions)

---

<div align="center">

**Made with ❤️ by Vue 3 + Claude**

</div>
