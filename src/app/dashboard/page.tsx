'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    posts: 0,
    views: 0,
    comments: 0
  })
  const [loading, setLoading] = useState(true)
  
  // 初始化Supabase客户端，处理环境变量缺失的情况
  const [supabaseInstance, setSupabaseInstance] = useState<any>(null);
  
  useEffect(() => {
    try {
      const client = createClient();
      setSupabaseInstance(client);
    } catch (error) {
      console.error('Supabase客户端初始化失败:', error);
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!supabaseInstance) {
        setLoading(false);
        return;
      }
      
      const { data: { user } } = await supabaseInstance.auth.getUser()
      if (!user) return

      // 获取文章总数
      const { count: postsCount, error: postsError } = await supabaseInstance
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
      
      if (postsError) console.error('Error fetching posts count:', postsError)

      // 获取该作者的所有文章 ID
      const { data: userPosts, error: userPostsError } = await supabaseInstance
        .from('posts')
        .select('id')
        .eq('author_id', user.id)
      
      if (userPostsError) console.error('Error fetching user posts:', userPostsError)
      
      let commentsCount = 0
      if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map((p: any) => p.id)
        // 获取这些文章收到的所有评论（不限状态）
        const { count, error: commentsError } = await supabaseInstance
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds)
        
        if (commentsError) console.error('Error fetching comments count:', commentsError)
        commentsCount = count || 0
      }

      setStats({
        posts: postsCount || 0,
        views: 0, // 目前 schema 中没有 views 字段，暂设为 0
        comments: commentsCount
      })
      setLoading(false)
    }

    fetchStats()
  }, [supabaseInstance])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">控制面板</h1>
        <p className="text-muted-foreground">欢迎回来！在这里管理您的博客和个人资料。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">总文章数</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.posts}</p>
        </div>
        <div className="rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">总浏览量</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.views}</p>
        </div>
        <div className="rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">收到的评论</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.comments}</p>
        </div>
      </div>
    </div>
  )
}
