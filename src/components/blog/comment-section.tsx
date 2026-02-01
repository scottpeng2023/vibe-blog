'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { User, MessageSquare } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  profiles: {
    full_name: string | null
  } | null
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at, parent_id, profiles(full_name)')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
    } else {
      const allComments = (data as any[]).map(c => ({
        ...c,
        profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      })) as Comment[]
      const commentMap = new Map<string, Comment>()
      const roots: Comment[] = []

      allComments.forEach(c => {
        commentMap.set(c.id, { ...c, replies: [] })
      })

      allComments.forEach(c => {
        if (c.parent_id && commentMap.has(c.parent_id)) {
          commentMap.get(c.parent_id)!.replies!.push(commentMap.get(c.id)!)
        } else {
          roots.push(commentMap.get(c.id)!)
        }
      })

      setComments(roots.reverse()) // 最新的根评论在前
    }
    setIsFetching(false)
  }, [postId, supabase])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
    fetchComments()
  }, [supabase.auth, fetchComments])

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault()
    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    if (!user) {
      toast.error('请先登录后再发表评论')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.from('comments').insert({
      content: content,
      post_id: postId,
      author_id: user.id,
      parent_id: parentId,
      status: 'pending', // 默认待审核
    })

    if (error) {
      toast.error('发表评论失败：' + error.message)
    } else {
      toast.success('评论已提交，请等待博主审核')
      if (parentId) {
        setReplyContent('')
        setReplyTo(null)
      } else {
        setNewComment('')
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="mt-12 space-y-8 border-t pt-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-2xl font-bold">评论 ({comments.length})</h2>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="写下您的评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isLoading}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !newComment.trim()}>
              {isLoading ? '提交中...' : '提交评论'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg bg-muted p-6 text-center">
          <p className="text-muted-foreground">
            请 <Button variant="link" className="p-0 h-auto font-normal" onClick={() => window.location.href = '/login'}>登录</Button> 后发表评论。
          </p>
        </div>
      )}

      <div className="space-y-6">
        {isFetching ? (
          <div className="text-center py-4 text-muted-foreground">加载评论中...</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <div className="flex gap-4 rounded-lg border p-4 shadow-sm bg-card">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{comment.profiles?.full_name || '匿名用户'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    >
                      回复
                    </Button>
                  </div>

                  {replyTo === comment.id && (
                    <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4 space-y-3 border-t pt-4">
                      <Textarea
                        placeholder={`回复 ${comment.profiles?.full_name || '匿名用户'}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[80px] text-sm"
                        disabled={isLoading}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyTo(null)}
                        >
                          取消
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading || !replyContent.trim()}>
                          {isLoading ? '提交中...' : '提交回复'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* 渲染子评论 */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-12 space-y-4 border-l-2 pl-6">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3 rounded-lg border p-3 shadow-sm bg-muted/30">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5">
                          <User className="h-5 w-5 text-primary/70" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{reply.profiles?.full_name || '匿名用户'}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(reply.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-muted-foreground">暂无评论，快来抢沙发吧！</p>
        )}
      </div>
    </div>
  )
}
