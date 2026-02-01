'use client'

import { useState, useEffect, use } from 'react'
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

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')

  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {


      // 获取文章详情
      const { data: post, error } = await supabase
        .from('posts')
        .select('*, post_tags(tags(name))')
        .eq('id', id)
        .single()

      if (error) {
        toast.error('获取文章失败')
        router.push('/dashboard/posts')
      } else if (post) {
        setTitle(post.title)
        setSlug(post.slug)
        setExcerpt(post.excerpt || '')
        setContent(post.content || '')
        setFeaturedImage(post.featured_image || '')
        setPublished(post.published)
        
        // 设置现有标签
        if (post.post_tags) {
          const existingTags = post.post_tags.map((pt: any) => pt.tags.name)
          setTags(existingTags)
        }
      }
      setIsFetching(false)
    }

    fetchData()
  }, [id, router, supabase])

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

  const handleSubmit = async (isPublished: boolean) => {
    if (!title || !slug || !content) {
      toast.error('请填写标题、Slug 和内容')
      return
    }

    setIsLoading(true)

    // 1. 更新文章基础信息
    const { error: postError } = await supabase
      .from('posts')
      .update({
        title,
        slug,
        excerpt,
        content,
        featured_image: featuredImage,
        published: isPublished,
        published_at: isPublished && !published ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (postError) {
      toast.error('保存失败：' + postError.message)
      setIsLoading(false)
      return
    }

    // 2. 处理标签（先删除旧的，再插入新的 - 简单处理逻辑）
    await supabase.from('post_tags').delete().eq('post_id', id)
    
    if (tags.length > 0) {
      for (const tagName of tags) {
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
          await supabase.from('post_tags').insert({ post_id: id, tag_id: tag.id })
        }
      }
    }

    toast.success(isPublished ? '文章已发布' : '草稿已保存')
    router.push('/dashboard/posts')
    router.refresh()
    setIsLoading(false)
  }

  if (isFetching) return <div>加载中...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">编辑文章</h1>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            placeholder="文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            保存为草稿
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
          >
            {isLoading ? '发布中...' : published ? '更新并发布' : '发布文章'}
          </Button>
        </div>
      </div>
    </div>
  )
}
