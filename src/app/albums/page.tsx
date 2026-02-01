'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface Album {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  created_at: string;
  photo_count: number;
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      // 首先获取所有相册
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select(`
          id, 
          title, 
          description, 
          cover_image, 
          created_at
        `)
        .not('cover_image', 'is', null) // 只显示有封面的相册
        .limit(20) // 限制返回数量
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;

      // 对每个相册获取照片数量
      const albumsWithCounts = [];
      for (const album of albumsData) {
        const { count, error: countError } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', album.id);
          
        if (countError) {
          console.error('Error counting photos:', countError);
        }
        
        albumsWithCounts.push({
          ...album,
          photo_count: count || 0
        });
      }

      setAlbums(albumsWithCounts);
    } catch (error: any) {
      console.error('Error fetching albums:', error);
      toast.error('加载相册失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl overflow-hidden h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">相册集</h1>
          <p className="text-muted-foreground mt-2">
            探索我们的精彩相册
          </p>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium">暂无相册</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              当前没有公开的相册可供浏览。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map((album) => (
              <Card key={album.id} className="overflow-hidden group">
                <div className="relative aspect-video">
                  <Link href={`/albums/${album.id}`} className="block">
                  {album.cover_image ? (
                    <img
                      src={album.cover_image}
                      alt={album.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  </Link>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <Button variant="secondary" className="w-full" asChild>
                      <Link href={`/albums/${album.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> 查看相册
                      </Link>
                    </Button>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg truncate">
                    <Link href={`/albums/${album.id}`} className="hover:underline">
                      {album.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {album.description || '暂无描述'}
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">
                      {album.photo_count} 张照片
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(album.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}