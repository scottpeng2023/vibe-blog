# 数据库设置指南

由于您遇到了 "Could not find the table 'public.albums' in the schema cache" 错误，这说明相册表尚未在您的数据库中创建。请按照以下步骤应用数据库迁移：

## 方法一：使用 Supabase CLI（推荐）

如果您已安装 Supabase CLI，请运行以下命令：

```bash
cd d:\ai-coding\0127blog
npx supabase db reset
```

或者：

```bash
cd d:\ai-coding\0127blog
npx supabase db push
```

## 方法二：手动执行 SQL

如果您没有安装 Supabase CLI 或遇到问题，请手动在数据库中执行以下 SQL 命令：

1. 访问您的 Supabase 项目仪表板
2. 进入 SQL 编辑器
3. 执行以下 SQL（来自 `supabase/migrations/20260128000000_init.sql`）：

**注意：如果遇到存储权限错误（如“权限不足。请联系管理员检查存储策略。”），请先执行下面的存储策略修复步骤。**

```sql
-- 创建 albums 表
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 photos 表
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 albums 更新时间触发器
CREATE TRIGGER albums_updated_at BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 启用 albums 和 photos 表的 RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 为 album-images 存储桶添加策略（如果不存在）
INSERT INTO storage.buckets (id, name, public, created_at, updated_at) 
VALUES ('album-images', 'album-images', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 为 album-images bucket 添加策略
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

-- 添加 albums 策略
CREATE POLICY "Users can view own albums"
  ON albums FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create albums"
  ON albums FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own albums"
  ON albums FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own albums"
  ON albums FOR DELETE USING (auth.uid() = author_id);

-- 添加 photos 策略
CREATE POLICY "Users can view photos from own albums"
  ON photos FOR SELECT USING (EXISTS (
    SELECT 1 FROM albums WHERE albums.id = photos.album_id AND albums.author_id = auth.uid()
  ));

CREATE POLICY "Users can create photos in own albums"
  ON photos FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM albums WHERE albums.id = photos.album_id AND albums.author_id = auth.uid()
  ));

CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE USING (EXISTS (
    SELECT 1 FROM albums WHERE albums.id = photos.album_id AND albums.author_id = auth.uid()
  ));

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE USING (EXISTS (
    SELECT 1 FROM albums WHERE albums.id = photos.album_id AND albums.author_id = auth.uid()
  ));
```

## 安装 Supabase CLI（如果需要）

如果需要安装 Supabase CLI，可以使用以下命令之一：

npm:
```bash
npm install -g @supabase/cli
```

或者直接使用 npx:
```bash
npx @supabase/cli@latest db reset
```

## 存储策略修复步骤

如果在使用图片上传功能时遇到“权限不足”的错误，请执行以下存储策略修复命令：

```sql
-- 删除可能存在的旧策略（如果有）
DROP POLICY IF EXISTS "Allow public read access to post images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert access to post images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update access to post images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete access to post images" ON storage.objects;

-- 为 post-images bucket 重新添加策略
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

-- 为 album-images bucket 重新添加策略
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

## 故障排除

如果仍然遇到问题，请尝试以下步骤：

1. 确保您的 Supabase 项目已启用 Storage 服务
2. 检查您的用户身份认证是否正常工作
3. 确认环境变量（NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY）已正确设置

完成数据库设置后，重启您的开发服务器，相册功能应该可以正常使用了。