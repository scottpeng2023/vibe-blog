# ✨ 阶段五：互动与性能调优 (Polish Plan)

> **负责人**: Agent E  
> **依赖**: [Display Plan](./plan-blog-display.md), [Auth Plan](./plan-blog-auth.md)  
> **验收人**: 项目经理

## 5.1 评论系统 (MVP+)
- [x] **任务**: 实现评论列表与提交。
  - 路径: `src/components/blog/comment-section.tsx`。
- [x] **任务**: 联调 RLS。
  - **验证**: 只有已登录用户能发表评论，未审核评论仅博主可见。

## 5.2 性能与部署
- [x] **任务**: 图片优化。
  - 操作: 替换所有 `<img>` 为 `next/image`。
- [ ] **任务**: 部署到 Vercel。
  - **验证**: 访问线上 URL，全站功能正常，Lighthouse 性能评分 > 90。
