'use client';

import { useState } from 'react';
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

const forgotPasswordSchema = zod.object({
  email: zod.string().email({ message: '请输入有效的邮箱地址' }),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<zod.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: zod.infer<typeof forgotPasswordSchema>) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        toast.error('重置密码邮件发送失败：' + error.message);
        return;
      }

      toast.success('重置密码邮件已发送，请检查您的邮箱！');
      form.reset();
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
          <h2 className="mt-6 text-center text-3xl font-extrabold">重置密码</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            输入您的邮箱地址，我们将发送重置密码链接
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱地址</FormLabel>
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '发送中...' : '发送重置链接'}
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