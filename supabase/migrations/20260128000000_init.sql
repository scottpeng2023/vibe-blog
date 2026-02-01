-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles 表（扩展 auth.users）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- posts 表
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published, published_at DESC);

-- tags 表
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- post_tags 关联表
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- categories 表
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- posts_categories 关联表
CREATE TABLE posts_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- albums 表
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- photos 表
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- comments 表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);

-- likes 表
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER albums_updated_at BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Storage 策略
INSERT INTO storage.buckets (id, name, public, created_at, updated_at) 
VALUES ('post-images', 'post-images', true, NOW(), NOW()),
       ('album-images', 'album-images', true, NOW(), NOW());

-- 为 post-images bucket 添加策略
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

-- profiles 策略
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- posts 策略
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT USING (published = true);

CREATE POLICY "Authors can view own posts"
  ON posts FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = author_id);

-- albums 策略
CREATE POLICY "Users can view own albums"
  ON albums FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create albums"
  ON albums FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own albums"
  ON albums FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own albums"
  ON albums FOR DELETE USING (auth.uid() = author_id);

-- photos 策略
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

-- comments 策略
CREATE POLICY "Approved comments are viewable by everyone"
  ON comments FOR SELECT USING (status = 'approved');

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
