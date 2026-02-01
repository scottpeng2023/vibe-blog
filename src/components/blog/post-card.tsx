import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'
import Image from 'next/image'

interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    published_at: string | null
    featured_image: string | null
    profiles: {
      full_name: string | null
    } | null
  }
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden">
      <Link href={`/blog/${post.slug}`}>
        <div className="relative aspect-video w-full overflow-hidden border-b">
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">暂无封面</span>
            </div>
          )}
        </div>
      </Link>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <Link href={`/blog/${post.slug}`}>
            <CardTitle className="text-2xl hover:text-primary transition-colors cursor-pointer">
              {post.title}
            </CardTitle>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-3">
          {post.excerpt || '暂无摘要'}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground pt-4 border-t">
        <div className="flex items-center gap-1">
          <span>{post.profiles?.full_name || '匿名作者'}</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          <span>
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString('zh-CN')
              : '未发布'}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
