import { createClient } from '@/lib/supabase/server'
import { PostCard } from '@/components/blog/post-card'
import { Input } from '@/components/ui/input'
import { Search, Tag, FolderOpen, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 300 // ISR: 每 5 分钟重新验证

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string }>
}) {
  const { q, category, tag } = await searchParams
  const supabase = await createClient(false)

  // 1. 构建文章查询
  let query = supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, featured_image, profiles!inner(full_name)')
    .eq('published', true)

  // 2. 获取标签列表 (Top 10)
  const { data: tags } = await supabase
    .from('tags')
    .select('name, slug')
    .limit(10)

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  

  if (tag) {
    // 标签过滤稍微复杂，需要通过 post_tags 关联表
    const { data: taggedPosts } = await supabase
      .from('post_tags')
      .select('post_id')
      .filter('tags.slug', 'eq', tag)
    
    if (taggedPosts) {
      const ids = taggedPosts.map(p => p.post_id)
      query = query.in('id', ids)
    }
  }

  const { data: posts, error } = await query.order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', JSON.stringify(error, null, 2))
  }

  // 处理文章数据
  let processedPosts: any[] = [];
  if (posts && posts.length > 0) {
    processedPosts = posts.map(post => {
      const postProfile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
      
      return {
        ...post,
        profiles: postProfile,
      };
    });
  }
  
  // 按月份分组文章
  const postsByMonth: Record<string, any[]> = {};
  processedPosts.forEach(post => {
    const date = new Date(post.published_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    
    if (!postsByMonth[monthName]) {
      postsByMonth[monthName] = [];
    }
    postsByMonth[monthName].push(post);
  });
  
  // 获取所有月份列表
  const months = Object.keys(postsByMonth).sort().reverse(); // 按时间倒序排列

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-12">
        


        <div className="flex flex-col lg:flex-row gap-12">
          {/* 左侧：文章列表 */}
          <div className="flex-1">
            {(q || category || tag) && (
              <div className="mb-8 flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {q ? (
                    <>
                      <Search className="h-5 w-5 text-primary" /> 搜索: "{q}"
                    </>
                  ) : tag ? (
                    <>
                      <Tag className="h-5 w-5 text-primary" /> 标签: {tag}
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-5 w-5 text-primary" /> 全部文章
                    </>
                  )} 的结果
                </h2>
                <Link href="/" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  清除筛选
                </Link>
              </div>
            )}

            <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {processedPosts.length > 0 ? (
                processedPosts.map((post) => (
                  <div key={post.id} className="card-hover">
                    <PostCard key={post.id} post={post} />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl p-12 bg-card/50">
                  <div className="mx-auto max-w-md">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">没有找到相关文章</h3>
                    <p className="mb-6">尝试使用其他关键词搜索，或浏览我们的分类和标签</p>
                    <Link 
                      href="/" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                    >
                      返回首页
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：侧边栏 */}
          <aside className="w-full lg:w-72 space-y-10">
            {/* 分类 */}
            <div className="space-y-4 p-6 rounded-xl border bg-card/30 backdrop-blur-sm">
              <h3 className="flex items-center gap-2 font-bold border-b pb-2 text-lg">
                <FolderOpen className="h-5 w-5 text-primary" /> 文章分类
              </h3>
              <div className="flex flex-col gap-3">
                <Link 
                  href="/" 
                  className={`text-sm py-2 px-3 rounded-lg transition-colors flex justify-between items-center ${!category ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'}`}
                >
                  <span>全部文章</span>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {processedPosts.length}
                  </span>
                </Link>
                {months?.map(month => (
                  <Link 
                    key={month} 
                    href="#"
                    className={`text-sm py-2 px-3 rounded-lg transition-colors flex justify-between items-center ${false ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'}`}
                  >
                    <span>{month}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {postsByMonth[month]?.length || 0}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 标签 */}
            <div className="space-y-4 p-6 rounded-xl border bg-card/30 backdrop-blur-sm">
              <h3 className="flex items-center gap-2 font-bold border-b pb-2 text-lg">
                <Tag className="h-5 w-5 text-primary" /> 热门标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags?.map(t => (
                  <Link 
                    key={t.slug} 
                    href={`/?tag=${t.slug}`}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all hover:scale-105 ${tag === t.slug ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:border-primary'}`}
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 统计信息 */}
            <div className="p-6 rounded-xl border bg-card/30 backdrop-blur-sm">
              <h3 className="font-bold border-b pb-2 mb-4 text-lg">统计信息</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">总文章数</span>
                  <span className="font-semibold">{processedPosts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">月份数量</span>
                  <span className="font-semibold">{months?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">标签数量</span>
                  <span className="font-semibold">{tags?.length || 0}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
