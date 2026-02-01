'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MarkdownEditor } from '@/components/blog/markdown-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')

  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()


  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    // 自动生成 slug
    setSlug(val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''))
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSubmit = async (published: boolean) => {
    if (!title || !slug || !content) {
      toast.error('请填写标题、Slug 和内容')
      return
    }

    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 确保 profile 存在，如果不存在则自动创建一个（修复外键约束错误）
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      })
      if (profileError) {
        toast.error('初始化用户配置失败：' + profileError.message)
        setIsLoading(false)
        return
      }
    }

    // 1. 插入文章
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title,
        slug,
        excerpt,
        content,
        featured_image: featuredImage,
        author_id: user.id,
        published,
        published_at: published ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (postError) {
      toast.error('保存失败：' + postError.message)
      setIsLoading(false)
      return
    }

    // 2. 处理标签
    if (tags.length > 0 && post) {
      for (const tagName of tags) {
        // 查找或创建标签
        let { data: tag } = await supabase.from('tags').select('id').eq('name', tagName).maybeSingle()
        
        if (!tag) {
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ name: tagName, slug: tagName.toLowerCase().replace(/ /g, '-') })
            .select()
            .single()
          tag = newTag
        }

        if (tag) {
          await supabase.from('post_tags').insert({
            post_id: post.id,
            tag_id: tag.id
          })
        }
      }
    }

    toast.success(published ? '文章已发布' : '草稿已保存')
    router.push('/dashboard/posts')
    router.refresh()
    setIsLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">新建文章</h1>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            placeholder="文章标题"
            value={title}
            onChange={handleTitleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL 路径)</Label>
          <Input
            id="slug"
            placeholder="my-awesome-post"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">摘要</Label>
          <Textarea
            id="excerpt"
            placeholder="简短的文章摘要..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>封面图片</Label>
          <ImageUpload
            initialImageUrl={featuredImage}
            onImageUpload={setFeaturedImage}
            bucketName="post-images"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">标签 (按回车添加)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <Input
            id="tags"
            placeholder="输入标签名..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
        </div>

        <div className="space-y-2">
          <Label>内容</Label>
          <MarkdownEditor
            value={content}
            onChange={(val) => setContent(val)}
          />
        </div>

        <div className="flex justify-end gap-4 pb-10">
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={isLoading}
          >
            保存草稿
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
          >
            {isLoading ? '发布中...' : '发布文章'}
          </Button>
        </div>
      </div>
    </div>
  )
}
