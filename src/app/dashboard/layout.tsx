'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)
  const router = useRouter()
  
  useEffect(() => {
    try {
      const client = createClient();
      setSupabase(client);
    } catch (error) {
      console.error('Supabase初始化失败:', error);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
        } else {
          setUser(user)
        }
      } catch (error) {
        console.error('用户检查失败:', error);
        router.push('/login');
      } finally {
        setLoading(false)
      }
    }
    
    if (supabase) {
      checkUser()
    }
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        加载中...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-160px)] gap-8 py-8">
      <aside className="w-64 space-y-2">
        <Link
          href="/dashboard"
          className="block rounded-md px-4 py-2 hover:bg-muted font-medium"
        >
          概览
        </Link>
        <Link
          href="/dashboard/posts"
          className="block rounded-md px-4 py-2 hover:bg-muted font-medium"
        >
          文章管理
        </Link>

        <Link
          href="/dashboard/albums"
          className="block rounded-md px-4 py-2 hover:bg-muted font-medium"
        >
          相册管理
        </Link>
        <Link
          href="/dashboard/comments"
          className="block rounded-md px-4 py-2 hover:bg-muted font-medium"
        >
          评论管理
        </Link>
        <Link
          href="/dashboard/settings"
          className="block rounded-md px-4 py-2 hover:bg-muted font-medium"
        >
          个人设置
        </Link>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
