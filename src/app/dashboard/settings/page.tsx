'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as zod from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

const settingsSchema = zod.object({
  fullName: zod.string().min(2, { message: '姓名长度至少为 2 位' }),
  bio: zod.string().max(160, { message: '简介长度不能超过 160 个字符' }).optional(),
  website: zod.string().url({ message: '请输入有效的网址' }).optional().or(zod.literal('')),
})

const passwordSchema = zod
  .object({
    currentPassword: zod.string().min(6, { message: '当前密码长度至少为 6 位' }),
    newPassword: zod.string().min(6, { message: '新密码长度至少为 6 位' }),
    confirmNewPassword: zod.string().min(6, { message: '确认密码长度至少为 6 位' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '新密码与确认密码不匹配',
    path: ['confirmNewPassword'],
  })

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const supabase = createClient()

  const passwordForm = useForm<zod.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const form = useForm<zod.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: '',
      bio: '',
      website: '',
    },
  })

  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '');
        setUserId(user.id || '');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          form.reset({
            fullName: data.full_name || '',
            bio: data.bio || '',
            website: data.website || '',
          })
        }
      }
      setIsFetching(false)
    }

    fetchProfile()
  }, [form, supabase])

  async function onSubmit(values: zod.infer<typeof settingsSchema>) {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.fullName,
          bio: values.bio,
          website: values.website,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        toast.error('更新失败：' + error.message)
        return
      }

      toast.success('个人资料已更新！')
    } catch (error) {
      toast.error('发生了一些错误，请稍后再试。')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <div>加载中...</div>
  }

  const handlePasswordSubmit = async (values: zod.infer<typeof passwordSchema>) => {
    setPasswordLoading(true);
    try {
      // 更新密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });
      
      if (updateError) {
        toast.error('密码更新失败：' + updateError.message);
        return;
      }
      
      toast.success('密码已成功更新！');
      
      // 重置表单
      passwordForm.reset();
    } catch (error) {
      toast.error('发生了一些错误，请稍后再试。');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">个人设置</h1>
        <p className="text-muted-foreground">在这里更新您的个人资料信息。</p>
      </div>
      
      {/* 用户基本信息显示 */}
      <div className="max-w-xl rounded-lg border p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-4">账户信息</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">用户名</h3>
            <p className="mt-1 text-sm">
              {userEmail.split('@')[0] || '未设置'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">邮箱地址</h3>
            <p className="mt-1 text-sm">
              {userEmail || '未设置'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">账户ID</h3>
            <p className="mt-1 text-sm">
              {userId || 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-xl rounded-lg border p-8 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="张三" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>个人简介</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="关于我的一点介绍..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '更新中...' : '保存个人资料'}
            </Button>
          </form>
        </Form>
      </div>
      
      {/* 密码修改部分 */}
      <div className="max-w-xl rounded-lg border p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-4">修改密码</h2>
        <p className="text-muted-foreground mb-6">更改您的账户密码</p>
        
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>当前密码</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="请输入当前密码" 
                      {...field} 
                      disabled={passwordLoading} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新密码</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="请输入新密码" 
                      {...field} 
                      disabled={passwordLoading} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认新密码</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="请再次输入新密码" 
                      {...field} 
                      disabled={passwordLoading} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? '更新中...' : '更改密码'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
