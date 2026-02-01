'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Moon, Sun, Menu, X, Search, User as UserIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Input } from '@/components/ui/input'

export const Header = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  
  // 初始化Supabase客户端，处理环境变量缺失的情况
  const [supabaseInstance, setSupabaseInstance] = useState<any>(null);
  
  useEffect(() => {
    try {
      const client = createClient();
      setSupabaseInstance(client);
    } catch (error) {
      console.warn('Supabase客户端初始化失败:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabaseInstance) {
      return; // 如果supabase实例未初始化，直接返回
    }
    
    const getUser = async () => {
      const { data: { user } } = await supabaseInstance.auth.getUser()
      setUser(user)
      
      // 获取用户详细信息
      if (user) {
        const { data: profileData } = await supabaseInstance
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setUserName(profileData.full_name || user.email?.split('@')[0] || '用户');
        } else {
          // 如果没有找到profile，使用邮箱的用户名部分
          setUserName(user.email?.split('@')[0] || '用户');
        }
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabaseInstance.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          // 用户登录状态改变时也获取用户名
          const fetchUserName = async () => {
            const { data: profileData } = await supabaseInstance
              .from('profiles')
              .select('full_name')
              .eq('id', session.user!.id)
              .single();
            
            if (profileData) {
              setUserName(profileData.full_name || session.user!.email?.split('@')[0] || '用户');
            } else {
              setUserName(session.user!.email?.split('@')[0] || '用户');
            }
          };
          fetchUserName();
        } else {
          setUserName(null);
        }
      }
    )

    return () => subscription?.unsubscribe && subscription.unsubscribe()
  }, [supabaseInstance])

  const handleLogout = async () => {
    if (!supabaseInstance) {
      console.error('Supabase客户端未初始化');
      return;
    }
    
    await supabaseInstance.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm">B</span>
          <span className="hidden sm:inline-block">Vibe Blog</span>
        </Link>
        
        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-6">
          <form action="/" method="GET" className="mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="q"
                placeholder="搜索文章..." 
                className="pl-9 h-9 w-48"
              />
            </div>
          </form>
          
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            首页
          </Link>
          <Link href="/albums" className="text-sm font-medium hover:text-primary transition-colors">
            相册
          </Link>
          {!loading && user && (
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              {userName || '用户'}
            </Link>
          )}
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="切换主题"
              className="h-8 w-8"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            {!loading && (
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <Link href="/dashboard/posts/new" className="hidden sm:block mr-2">
                      <Button variant="outline" size="sm" className="btn-hover">
                        写文章
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="btn-hover text-red-500 hover:text-red-600">
                      退出
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm" className="btn-hover">
                      <Link href="/login">登录</Link>
                    </Button>
                    <Button asChild size="sm" className="btn-hover">
                      <Link href="/register">注册</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
        
        {/* 移动端菜单按钮 */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="切换主题"
            className="h-8 w-8"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="切换菜单"
            className="h-8 w-8"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background py-4 px-4">
          <div className="flex flex-col gap-3">
            <Link href="/" className="text-sm font-medium hover:text-primary py-2 block" onClick={() => setMobileMenuOpen(false)}>
              首页
            </Link>
            <Link href="/albums" className="text-sm font-medium hover:text-primary py-2 block" onClick={() => setMobileMenuOpen(false)}>
              相册
            </Link>
            {!loading && user && (
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary py-2 block flex items-center gap-1" onClick={() => setMobileMenuOpen(false)}>
                <UserIcon className="h-4 w-4" />
                {userName || '用户'}
              </Link>
            )}
            {!loading && (
              <div className="pt-2 border-t mt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link href="/dashboard/posts/new" className="block" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full btn-hover">
                        写文章
                      </Button>
                    </Link>
                    <Button variant="destructive" className="w-full btn-hover" onClick={handleLogout}>
                      退出
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="btn-hover">
                      <Link href="/login">登录</Link>
                    </Button>
                    <Button asChild variant="outline" className="btn-hover">
                      <Link href="/register">注册</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
