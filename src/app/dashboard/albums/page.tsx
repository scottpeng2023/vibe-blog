'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';
import { albumService, Album } from '@/lib/album-service';
import { PlusIcon, TrashIcon } from 'lucide-react';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    cover_image: ''
  });
  const router = useRouter();

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const albumsData = await albumService.getAlbums();
      setAlbums(albumsData);
    } catch (error: any) {
      console.error('Error loading albums:', error);
      toast.error('加载相册失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbum.title.trim()) {
      toast.error('请输入相册标题');
      return;
    }

    try {
      await albumService.createAlbum(
        newAlbum.title,
        newAlbum.description,
        newAlbum.cover_image
      );

      toast.success('相册创建成功');
      setShowCreateDialog(false);
      setNewAlbum({ title: '', description: '', cover_image: '' });
      loadAlbums();
    } catch (error: any) {
      console.error('Error creating album:', error);
      toast.error('创建相册失败: ' + error.message);
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('确定要删除这个相册吗？此操作不可撤销。')) {
      return;
    }

    try {
      await albumService.deleteAlbum(id);

      toast.success('相册删除成功');
      loadAlbums();
    } catch (error: any) {
      console.error('Error deleting album:', error);
      toast.error('删除相册失败: ' + error.message);
    }
  };

  const handleImageUpload = (url: string) => {
    setNewAlbum(prev => ({ ...prev, cover_image: url }));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">相册管理</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> 创建相册
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新相册</DialogTitle>
              <DialogDescription>
                创建一个新的相册来管理您的照片
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  标题 *
                </Label>
                <Input
                  id="title"
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  描述
                </Label>
                <Textarea
                  id="description"
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  封面图片
                </Label>
                <div className="col-span-3">
                  <ImageUpload
                    initialImageUrl={newAlbum.cover_image}
                    onImageUpload={handleImageUpload}
                    bucketName="album-images"
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleCreateAlbum}>创建相册</Button>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : albums.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">还没有相册，点击上方按钮创建一个</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.id} className="overflow-hidden">
              <div className="relative">
                {album.cover_image ? (
                  <img
                    src={album.cover_image}
                    alt={album.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">暂无封面</span>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleDeleteAlbum(album.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader>
                <CardTitle className="truncate">{album.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {album.description || '暂无描述'}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  创建于 {new Date(album.created_at).toLocaleDateString()}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push(`/dashboard/albums/${album.id}`)}
                >
                  查看详情
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}