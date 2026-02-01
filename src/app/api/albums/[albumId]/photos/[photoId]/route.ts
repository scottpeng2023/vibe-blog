import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { albumId: string; photoId: string } }
) {
  try {
    noStore(); // 确保不缓存用户特定的数据
    
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { albumId, photoId } = params;

    // 验证用户是否有权更新此照片
    // 首先获取用户拥有的相册ID列表
    const { data: userAlbums, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('author_id', user.id);

    if (albumError || !userAlbums || userAlbums.length === 0) {
      return Response.json({ error: 'Photo not found or unauthorized' }, { status: 404 });
    }

    const userAlbumIds = userAlbums.map(album => album.id);

    const { error: photoCheckError } = await supabase
      .from('photos')
      .select('id')
      .eq('id', photoId)
      .eq('album_id', albumId)
      .in('album_id', userAlbumIds)
      .single();

    if (photoCheckError) {
      return Response.json({ error: 'Photo not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { caption, alt_text } = body;

    const { data, error } = await supabase
      .from('photos')
      .update({ 
        caption,
        alt_text
      })
      .eq('id', photoId)
      .eq('album_id', albumId)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { albumId: string; photoId: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { albumId, photoId } = params;

    // 验证用户是否有权删除此照片
    // 首先获取用户拥有的相册ID列表
    const { data: userAlbums, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('author_id', user.id);

    if (albumError || !userAlbums || userAlbums.length === 0) {
      return Response.json({ error: 'Photo not found or unauthorized' }, { status: 404 });
    }

    const userAlbumIds = userAlbums.map(album => album.id);

    const { error: photoCheckError } = await supabase
      .from('photos')
      .select('id')
      .eq('id', photoId)
      .eq('album_id', albumId)
      .in('album_id', userAlbumIds)
      .single();

    if (photoCheckError) {
      return Response.json({ error: 'Photo not found or unauthorized' }, { status: 404 });
    }

    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
      .eq('album_id', albumId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Photo deleted successfully' });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}