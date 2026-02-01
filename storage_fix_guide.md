# 存储权限修复指南

## 问题描述
当您在文章编辑页面或其他地方上传图片时，遇到错误："上传失败：权限不足。请联系管理员检查存储策略。"

## 问题原因
此错误通常是由于 Supabase Storage 的 Row Level Security (RLS) 策略配置不正确导致的。可能的原因包括：

1. 存储桶策略未正确创建
2. 存储桶不存在
3. 策略条件不符合当前认证状态
4. 用户角色权限不足

## 解决步骤

### 步骤 1: 检查存储桶是否存在
1. 登录到 Supabase 仪表板
2. 导航到 Storage 部分
3. 确认存在名为 `post-images` 和 `album-images` 的存储桶
4. 如果不存在，请创建它们并将它们设为公共可读

### 步骤 2: 应用正确的策略
在 SQL 编辑器中运行以下命令：

```sql
-- 为 post-images bucket 重新添加策略
DROP POLICY IF EXISTS "Allow public read access to post images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert access to post images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update access to post images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete access to post images" ON storage.objects;

CREATE POLICY "Allow public read access to post images" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'post-images');

CREATE POLICY "Allow authenticated insert access to post images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Allow authenticated update access to post images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'post-images');

CREATE POLICY "Allow authenticated delete access to post images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'post-images');

-- 为 album-images bucket 添加策略
DROP POLICY IF EXISTS "Allow public read access to album images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert access to album images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update access to album images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete access to album images" ON storage.objects;

CREATE POLICY "Allow public read access to album images" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'album-images');

CREATE POLICY "Allow authenticated insert access to album images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'album-images');

CREATE POLICY "Allow authenticated update access to album images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'album-images');

CREATE POLICY "Allow authenticated delete access to album images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'album-images');
```

### 步骤 3: 检查存储桶配置
确保存储桶设置正确：

```sql
-- 检查存储桶是否存在
SELECT * FROM storage.buckets 
WHERE name IN ('post-images', 'album-images');

-- 如果存储桶不存在，创建它们
INSERT INTO storage.buckets (id, name, public, created_at, updated_at) 
VALUES 
  ('post-images', 'post-images', true, NOW(), NOW()),
  ('album-images', 'album-images', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

### 步骤 4: 测试权限
您可以使用以下 SQL 来测试当前用户的权限：

```sql
-- 检查当前用户 ID
SELECT auth.uid();

-- 检查当前用户角色
SELECT role FROM auth.users WHERE id = auth.uid();
```

## 验证修复
完成上述步骤后：

1. 重启您的开发服务器
2. 登出并重新登录到您的应用程序
3. 尝试上传一张图片以确认问题是否解决

## 预防措施
为避免将来出现类似问题：

1. 在部署到生产环境前，确保所有必要的存储桶和策略都已正确配置
2. 定期检查 Supabase 项目的存储配置
3. 确保环境变量（如 SUPABASE_URL 和 SUPABASE_ANON_KEY）在所有环境中都正确设置

## 进一步排查
如果问题仍然存在：

1. 检查浏览器控制台中的详细错误信息
2. 确认您的 Supabase 项目计划支持 Storage 功能
3. 验证您的用户账户具有适当的权限
4. 检查是否启用了 RLS（Row Level Security）并且策略正确