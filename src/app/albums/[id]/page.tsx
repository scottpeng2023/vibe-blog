'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Image as ImageIcon, X } from 'lucide-react';

interface Album {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  created_at: string;
}

interface Photo {
  id: string;
  album_id: string;
  filename: string;
  url: string;
  caption: string;
  alt_text: string;
  created_at: string;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.id as string;
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAlbumDetails();
  }, [albumId]);

  const fetchAlbumDetails = async () => {
    try {
      // 获取相册信息
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .single();

      if (albumError) throw albumError;

      setAlbum(albumData);

      // 获取相册中的照片
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      setPhotos(photosData || []);
    } catch (error: any) {
      console.error('Error fetching album details:', error);
      toast.error('加载相册详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 text-center py-12">
          <h2 className="text-2xl font-bold">相册不存在</h2>
          <p className="text-muted-foreground mt-2">抱歉，找不到指定的相册。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <p className="text-muted-foreground mt-2">
            {album.description || '暂无描述'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            创建于 {new Date(album.created_at).toLocaleDateString()} • {photos.length} 张照片
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium">相册中暂无照片</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              这个相册中还没有添加任何照片。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <Card 
                key={photo.id} 
                className="overflow-hidden aspect-square cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <CardContent className="p-0 h-full flex items-center justify-center">
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.alt_text || photo.caption || '相册照片'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageIcon className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* 照片放大预览模态框 */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-7xl w-full max-h-[95vh] p-0 border-0 bg-white overflow-hidden flex flex-col">
            <DialogTitle className="sr-only">
              {selectedPhoto?.caption || selectedPhoto?.alt_text || '照片预览'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {selectedPhoto?.caption || selectedPhoto?.alt_text || '照片详情'}
            </DialogDescription>
            <div className="flex flex-col h-full">
              {/* 照片显示区域 */}
              <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
                {selectedPhoto && (
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.alt_text || selectedPhoto.caption || '放大的相册照片'}
                    className="max-h-[80vh] max-w-full object-contain"
                  />
                )}
              </div>
              
              {/* 照片信息面板 - 移到照片下方 */}
              <div className="bg-white border-t p-4 min-h-[180px]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium mb-3">照片信息</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPhoto?.caption && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 mb-1">描述</h5>
                          <p className="text-sm">{selectedPhoto.caption}</p>
                        </div>
                      )}
                      
                      {selectedPhoto?.alt_text && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 mb-1">替代文本</h5>
                          <p className="text-sm">{selectedPhoto.alt_text}</p>
                        </div>
                      )}
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-1">上传时间</h5>
                        <p className="text-sm">{selectedPhoto ? new Date(selectedPhoto.created_at).toLocaleString() : ''}</p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-1">文件名</h5>
                        <p className="text-sm truncate">{selectedPhoto?.filename}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}