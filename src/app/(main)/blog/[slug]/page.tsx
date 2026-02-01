import { use } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CalendarDays, User } from 'lucide-react'
import { CommentSection } from '@/components/blog/comment-section'
import Image from 'next/image'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  
  // 检查环境变量是否存在
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase配置缺失，使用默认元数据')
    return {
      title: '文章详情 | Vibe Blog',
      description: 'Vibe Blog - 分享知识与创意的平台',
    }
  }
  
  try {
    const supabase = await createClient(false)

    const { data: post } = await supabase
      .from('posts')
      .select('title, excerpt')
      .eq('slug', slug)
      .single()

    if (!post) {
      return {
        title: '文章未找到',
      }
    }

    return {
      title: `${post.title} | Vibe Blog`,
      description: post.excerpt || `${post.title} 的详情页面`,
    }
  } catch (error) {
    console.error('生成元数据时出错:', error)
    return {
      title: '文章详情 | Vibe Blog',
      description: 'Vibe Blog - 分享知识与创意的平台',
    }
  }
}

export async function generateStaticParams() {
  // 检查环境变量是否存在
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase配置缺失，跳过静态参数生成')
    return []
  }
  
  try {
    const supabase = await createClient(false)
    const { data: posts } = await supabase
      .from('posts')
      .select('slug')
      .eq('published', true)

    return posts?.map((post) => ({
      slug: post.slug,
    })) || []
  } catch (error) {
    console.error('生成静态参数时出错:', error)
    return []
  }
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // 首先获取文章基本信息
  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles(full_name)')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  


  if (error || !post) {
    notFound()
  }

  const processedPost = {
    ...post,
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
  }

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      {/* 封面图片 */}
      {processedPost.featured_image && (
        <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
          <Image
            src={processedPost.featured_image}
            alt={`${processedPost.title} 封面图片`}
            width={1200}
            height={630}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      )}
      
      <header className="mb-8 border-b pb-8">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
          {processedPost.title}
        </h1>
        <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{processedPost.profiles?.full_name || '匿名作者'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>
              {processedPost.published_at
                ? new Date(processedPost.published_at).toLocaleDateString('zh-CN')
                : '未发布'}
            </span>
          </div>
        </div>
        

      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: (props: any) => {
              // 尝试从props获取图像尺寸，确保是数字类型
              const width = typeof props.width === 'number' ? props.width : 1200;
              const height = typeof props.height === 'number' ? props.height : 675;
              
              return (
                <div className="relative aspect-video w-full my-8">
                  <Image
                    src={props.src || ''}
                    alt={props.alt || '文章图片'}
                    width={width}
                    height={height}
                    className="rounded-lg object-cover"
                  />
                </div>
              );
            },
          }}
        >
          {processedPost.content || ''}
        </ReactMarkdown>
      </div>

      <CommentSection postId={processedPost.id} />
    </article>
  )
}
