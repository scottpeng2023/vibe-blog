# 🔐 阶段二：认证系统与个人中心 (Auth Plan)

> **负责人**: Agent B  
> **依赖**: [Base Plan](./plan-blog-base.md) (Supabase Client, DB Schema)  
> **验收人**: Agent A

## 2.1 登录/注册页面开发
- [x] **任务**: 安装表单与验证库。
  - 命令: `npm install react-hook-form zod @hookform/resolvers`。
  - 命令: `npx shadcn-ui@latest add form input button label toast`。
- [x] **任务**: 实现登录/注册表单 UI。
  - 路径: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`。
- [x] **任务**: 接入 Supabase Auth 逻辑。
  - **验证**: 使用测试邮箱注册并登录，页面能正确重定向到首页且 `cookies` 中存有会话。

## 2.2 个人资料管理 (MVP+)
- [x] **任务**: 实现个人资料编辑。
  - 路径: `src/app/dashboard/settings/page.tsx`。
  - **验证**: 用户可以修改 full_name, bio 并成功保存到 `profiles` 表。
