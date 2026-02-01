# 📝 阶段三：内容管理核心 (CMS Plan)

> **负责人**: Agent C  
> **依赖**: [Base Plan](./plan-blog-base.md) (DB Schema), [Auth Plan](./plan-blog-auth.md) (Auth State)  
> **验收人**: Agent A

## 3.1 Markdown 编辑器开发
- [x] **任务**: 集成编辑器库。
  - 命令: `npm install @uiw/react-md-editor`。
- [x] **任务**: 封装 `MarkdownEditor` 组件。
  - 路径: `src/components/blog/markdown-editor.tsx`。
  - **验证**: 编辑器能实时渲染 Markdown 预览，支持基础语法。

## 3.2 文章 CRUD 与仪表盘
- [x] **任务**: 开发仪表盘文章列表。
  - 路径: `src/app/dashboard/posts/page.tsx`。
  - 命令: `npx shadcn-ui@latest add table badge dialog`。
- [x] **任务**: 实现文章创建与编辑 API 及页面。
  - 路径: `src/app/dashboard/posts/new/page.tsx`, `src/app/dashboard/posts/[id]/edit/page.tsx`。
  - **验证**: 点击保存能将数据持久化到 Supabase `posts` 表，且 `slug` 唯一性校验通过。
