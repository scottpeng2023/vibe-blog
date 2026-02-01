import { createClient } from '@/lib/supabase/server'

export default async function TestSupabasePage() {
  try {
    const supabase = await createClient()
    
    // 尝试获取当前时间或一个简单的查询来验证连接
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      return (
        <div className="p-8 space-y-4">
          <h1 className="text-2xl font-bold text-red-600">❌ Supabase 连接失败</h1>
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )
    }

    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold text-green-600">✅ Supabase 连接成功</h1>
        <p className="text-gray-600">能够成功访问数据库表。</p>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  } catch (err: any) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold text-red-600">❌ 运行时错误</h1>
        <p className="text-red-500">{err.message}</p>
      </div>
    )
  }
}
