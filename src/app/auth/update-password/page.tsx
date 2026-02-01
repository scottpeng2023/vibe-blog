'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as zod from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const updatePasswordSchema = zod
  .object({
    newPassword: zod.string().min(6, { message: '新密码长度至少为 6 位' }),
    confirmNewPassword: zod.string().min(6, { message: '确认密码长度至少为 6 位' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '新密码与确认密码不匹配',
    path: ['confirmNewPassword'],
  });

export default function UpdatePasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const form = useForm<zod.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // 检查URL参数中是否包含重置密码所需的参数
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (!accessToken || !refreshToken || type !== 'recovery') {
      // 如果URL参数不完整，重定向到登录页面
      router.push('/login');
      toast.error('无效的密码重置链接');
    }
  }, [searchParams, router]);

  async function onSubmit(values: zod.infer<typeof updatePasswordSchema>) {
    setLoading(true);
    try {
      // 使用Supabase的updateUser方法更新密码
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        toast.error('密码更新失败：' + error.message);
        return;
      }

      toast.success('密码已成功更新！请使用新密码登录。');
      // 密码更新成功后跳转到登录页面
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      toast.error('发生了一些错误，请稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">设置新密码</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            请输入您的新密码
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入新密码" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认新密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请再次输入新密码" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '更新中...' : '更新密码'}
            </Button>
          </form>
        </Form>
        
        <div className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}