'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, X, Trash2, MessageSquare } from 'lucide-react'

interface Comment {
  id: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  post_id: string
  posts: {
    title: string
  } | null
  profiles: {
    full_name: string | null
  } | null
}

export default function CommentsManagementPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // 初始化Supabase客户端，处理环境变量缺失的情况
  const [supabaseInstance, setSupabaseInstance] = useState<any>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // 检查环境变量是否存在
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setClientError('Supabase配置缺失，请检查环境变量');
        return;
      }
      const client = createClient();
      setSupabaseInstance(client);
    } catch (error) {
      console.error('Supabase客户端初始化失败:', error);
      setClientError('Supabase客户端初始化失败');
    }
  }, []);

  const fetchComments = useCallback(async () => {
    if (!supabaseInstance) {
      setLoading(false);
      return;
    }
    
    setLoading(true)
    const { data: { user } } = await supabaseInstance.auth.getUser()
    if (!user) return

    // 1. 先获取该作者的所有文章 ID
    const { data: userPosts } = await supabaseInstance
      .from('posts')
      .select('id')
      .eq('author_id', user.id)

    if (!userPosts || userPosts.length === 0) {
      setComments([])
      setLoading(false)
      return
    }

    const postIds = userPosts.map((p: any) => p.id)

    // 2. 获取这些文章下的所有评论
    const { data, error } = await supabaseInstance
      .from('comments')
      .select('*, posts(title), profiles(full_name)')
      .in('post_id', postIds)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('获取评论失败：' + error.message)
    } else {
      const processedComments = (data as any[]).map(c => ({
        ...c,
        profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
        posts: Array.isArray(c.posts) ? c.posts[0] : c.posts
      }))
      setComments(processedComments || [])
    }
    setLoading(false)
  }, [supabaseInstance])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabaseInstance
      .from('comments')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast.error('操作失败：' + error.message)
    } else {
      toast.success(status === 'approved' ? '已审核通过' : '已拒绝该评论')
      fetchComments()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要永久删除这条评论吗？')) return

    const { error } = await supabaseInstance
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('删除失败：' + error.message)
    } else {
      toast.success('删除成功')
      fetchComments()
    }
  }

  const handleReply = async (comment: Comment) => {
    if (!replyContent.trim()) return

    setSubmitting(true)
    const { data: { user } } = await supabaseInstance.auth.getUser()
    if (!user) return

    const { error } = await supabaseInstance.from('comments').insert({
      content: replyContent,
      post_id: comment.post_id,
      author_id: user.id,
      parent_id: comment.id,
      status: 'approved', // 管理员回复直接通过
    })

    if (error) {
      toast.error('回复失败：' + error.message)
    } else {
      toast.success('回复成功')
      setReplyContent('')
      setReplyingTo(null)
      fetchComments()
    }
    setSubmitting(false)
  }

  if (clientError) {
    return (
      <div className="p-8 text-center text-destructive">
        错误：{clientError}
        <br />
        请确保已正确配置Supabase环境变量。
      </div>
    );
  }
  
  if (loading) return <div className="p-8 text-center text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">评论管理</h1>
          <p className="text-muted-foreground">审核并管理读者在您文章下的评论。</p>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">评论内容</TableHead>
              <TableHead>文章</TableHead>
              <TableHead>评论者</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  暂无评论需要处理
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <tbody key={comment.id}>
                  <TableRow>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate text-sm" title={comment.content}>
                        {comment.content}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="truncate max-w-[150px] text-xs" title={comment.posts?.title}>
                        {comment.posts?.title || '未知文章'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {comment.profiles?.full_name || '匿名用户'}
                    </TableCell>
                    <TableCell>
                      {comment.status === 'pending' && (
                        <Badge variant="secondary">待审核</Badge>
                      )}
                      {comment.status === 'approved' && (
                        <Badge variant="default" className="bg-green-600">已通过</Badge>
                      )}
                      {comment.status === 'rejected' && (
                        <Badge variant="destructive">已拒绝</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          title="回复"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {comment.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleUpdateStatus(comment.id, 'approved')}
                              title="通过"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-orange-600"
                              onClick={() => handleUpdateStatus(comment.id, 'rejected')}
                              title="拒绝"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(comment.id)}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {replyingTo === comment.id && (
                    <TableRow key={`${comment.id}-reply`} className="bg-muted/30">
                      <TableCell colSpan={6} className="p-4">
                        <div className="flex flex-col gap-3 max-w-2xl ml-auto">
                          <textarea
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
                            placeholder={`回复 ${comment.profiles?.full_name || '匿名用户'}...`}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                              取消
                            </Button>
                            <Button size="sm" onClick={() => handleReply(comment)} disabled={submitting || !replyContent.trim()}>
                              {submitting ? '提交中...' : '发送回复'}
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </tbody>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
