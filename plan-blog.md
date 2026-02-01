# 📂 博客系统并行开发主计划 (Master Plan)

> **目标**: 将项目拆分为 5 个可由独立 Agent 并行执行的子计划。

## 🛰 子计划清单

| 子计划 | 职责范围 | 依赖项 | 状态 | 负责人 |
| :--- | :--- | :--- | :--- | :--- |
| [Base Plan](./plan-blog-base.md) | 基础设施、数据库 Schema、工具类、全局布局 | 无 | COMPLETE | Agent A |
| [Auth Plan](./plan-blog-auth.md) | 登录、注册、权限中间件、个人资料 | Base Plan | COMPLETE | Agent B |
| [CMS Plan](./plan-blog-cms.md) | 文章管理后台、Markdown 编辑器、CRUD | Base Plan, Auth Plan | COMPLETE | Agent C |
| [Display Plan](./plan-blog-display.md) | 首页展示、详情页渲染 (SSG/ISR)、SEO | Base Plan | COMPLETE | Agent D |
| [Polish Plan](./plan-blog-polish.md) | 评论系统、性能优化、生产部署 | Auth, Display | COMPLETE | Agent E |

---

## 🛠 并行开发说明
1. **职责分离**: 各个 Agent 负责其特定的子计划文件。
2. **状态同步**: 任务完成后，请更新对应的子计划文件中的勾选框，并同步更新此主计划的状态。
3. **依赖管理**: Agent B, C, D 需要等待 Agent A 完成基础设施搭建（或通过 Mock 接口先行开发）。
