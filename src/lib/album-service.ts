import { createClient } from './supabase/client';

export interface Album {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  album_id: string;
  filename: string;
  url: string;
  caption: string;
  alt_text: string;
  created_at: string;
}

export const albumService = {
  // 相册相关操作
  async getAlbums(): Promise<Album[]> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  },

  async createAlbum(title: string, description?: string, cover_image?: string): Promise<Album> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('albums')
      .insert([{ 
        title, 
        description: description || null, 
        cover_image: cover_image || null, 
        author_id: user.id 
      }])
      .select()
      .single();

    if (error) throw error;
    
    return data!;
  },

  async updateAlbum(id: string, updates: Partial<Omit<Album, 'id' | 'author_id' | 'created_at' | 'updated_at'>>): Promise<Album> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('albums')
      .update(updates)
      .eq('id', id)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    return data!;
  },

  async deleteAlbum(id: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id);

    if (error) throw error;
  },

  // 照片相关操作
  async getPhotos(albumId: string): Promise<Photo[]> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 首先验证用户是否有权访问此相册
    const { error: albumCheckError } = await supabase
      .from('albums')
      .select('id')
      .eq('id', albumId)
      .eq('author_id', user.id)
      .single();

    if (albumCheckError) {
      throw new Error('Album not found or unauthorized');
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  },

  async addPhoto(albumId: string, url: string, caption?: string, alt_text?: string): Promise<Photo> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 验证用户是否有权向此相册添加照片
    const { error: albumCheckError } = await supabase
      .from('albums')
      .select('id')
      .eq('id', albumId)
      .eq('author_id', user.id)
      .single();

    if (albumCheckError) {
      throw new Error('Album not found or unauthorized');
    }

    const filename = url.split('/').pop() || 'photo';

    const { data, error } = await supabase
      .from('photos')
      .insert([{ 
        album_id: albumId,
        filename,
        url,
        caption: caption || null,
        alt_text: alt_text || null
      }])
      .select()
      .single();

    if (error) throw error;
    
    return data!;
  },

  async updatePhoto(photoId: string, albumId: string, updates: Partial<Omit<Photo, 'id' | 'album_id' | 'filename' | 'url' | 'created_at'>>): Promise<Photo> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 验证用户是否有权更新此照片
    const { data: userAlbums, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('author_id', user.id);

    if (albumError || !userAlbums || userAlbums.length === 0) {
      throw new Error('Photo not found or unauthorized');
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
      throw new Error('Photo not found or unauthorized');
    }

    const { data, error } = await supabase
      .from('photos')
      .update(updates)
      .eq('id', photoId)
      .eq('album_id', albumId)
      .select()
      .single();

    if (error) throw error;
    
    return data!;
  },

  async deletePhoto(photoId: string, albumId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 验证用户是否有权删除此照片
    const { data: userAlbums, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('author_id', user.id);

    if (albumError || !userAlbums || userAlbums.length === 0) {
      throw new Error('Photo not found or unauthorized');
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
      throw new Error('Photo not found or unauthorized');
    }

    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
      .eq('album_id', albumId);

    if (error) throw error;
  }
};