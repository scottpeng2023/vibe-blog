# 📖 阶段四：前台展示与阅读体验 (Display Plan)

> **负责人**: Agent D  
> **依赖**: [Base Plan](./plan-blog-base.md) (DB Schema)  
> **验收人**: Agent C

## 4.1 首页与列表渲染
- [x] **任务**: 实现高效的文章列表。
  - 逻辑: 使用 Server Components 从 Supabase 获取数据，启用 ISR。
  - 路径: `src/app/(main)/page.tsx`。
- [x] **任务**: 实现详情页静态化。
  - 逻辑: 实现 `generateStaticParams`。
  - 路径: `src/app/(main)/blog/[slug]/page.tsx`。
  - **验证**: 生产构建 (`npm run build`) 时，现有文章应被预渲染为 HTML。

## 4.2 SEO 与 元数据
- [x] **任务**: 动态生成元数据。
  - 路径: `src/app/(main)/blog/[slug]/page.tsx` (使用 `generateMetadata`)。
  - **验证**: 使用 Meta 标签检查工具确认 `og:image` 和 `title` 正确。
