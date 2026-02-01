# 🛠 阶段一：环境搭建与架构初始化 (Base Plan)

> **负责人**: Agent A  
> **依赖**: 无  
> **验收人**: 项目经理

## 1.1 项目初始化
- [x] **任务**: 使用现代架构初始化 Next.js。
  - 命令: `npx create-next-app@latest . --typescript --tailwind --eslint --app` (选配置: App Router: Yes, src/ directory: Yes)。
  - **验证**: 运行 `npm run dev` 能看到 Next.js 默认欢迎页。
- [x] **任务**: 初始化 shadcn/ui 配置。
  - 命令: `npx shadcn-ui@latest init` (选配置: Style: New York, Color: Slate)。
  - **验证**: `components.json` 文件已生成。

## 1.2 Supabase 集成与数据库准备
- [x] **任务**: 安装 Supabase 依赖。
  - 命令: `npm install @supabase/auth-helpers-nextjs @supabase/supabase-js`。
- [x] **任务**: 建立数据库 Schema。
  - 操作: 在 Supabase SQL Editor 中执行 `spec-new.md` 中的 [SQL Schema](file:///d:/ai-coding/0127blog/spec-new.md#L113-L190)。
  - **验证**: 在 Supabase Dashboard 查看到 `profiles`, `posts`, `tags`, `comments`, `likes` 表。
- [x] **任务**: 配置 RLS 策略。
  - 操作: 执行 `spec-new.md` 中的 [RLS 策略代码](file:///d:/ai-coding/0127blog/spec-new.md#L192-L215)。
  - **验证**: 尝试匿名查询 `profiles` 表应成功，匿名插入应失败。

## 1.3 基础工具类与布局
- [x] **任务**: 配置 Supabase 客户端 (Server/Client 模式)。
  - 路径: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`。
- [x] **任务**: 建立全局布局。
  - 路径: `src/app/layout.tsx` (注入字体、ThemeProvider)。
  - 路径: `src/components/layout/header.tsx`, `footer.tsx`。
