'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as zod from 'zod'
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

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const supabase = createClient()

  const form = useForm<zod.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: '',
      bio: '',
      website: '',
    },
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">个人设置</h1>
        <p className="text-muted-foreground">在这里更新您的个人资料信息。</p>
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
              {isLoading ? '更新中...' : '保存更改'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
