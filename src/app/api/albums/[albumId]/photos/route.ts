import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    noStore(); // 确保不缓存用户特定的数据
    
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { albumId } = await params;

    // 首先验证用户是否有权访问此相册
    const { error: albumCheckError } = await supabase
      .from('albums')
      .select('id')
      .eq('id', albumId)
      .eq('author_id', user.id)
      .single();

    if (albumCheckError) {
      return Response.json({ error: 'Album not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { albumId } = await params;

    // 验证用户是否有权向此相册添加照片
    const { error: albumCheckError } = await supabase
      .from('albums')
      .select('id')
      .eq('id', albumId)
      .eq('author_id', user.id)
      .single();

    if (albumCheckError) {
      return Response.json({ error: 'Album not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { url, caption, alt_text } = body;

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    const filename = url.split('/').pop() || 'photo';

    const { data, error } = await supabase
      .from('photos')
      .insert([{ 
        album_id: albumId,
        filename,
        url,
        caption,
        alt_text
      }])
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}