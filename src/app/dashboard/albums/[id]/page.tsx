'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';
import { albumService, Album, Photo } from '@/lib/album-service';
import { PlusIcon, TrashIcon, Pencil } from 'lucide-react';

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params.id as string;
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPhotoDialog, setShowAddPhotoDialog] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    url: '',
    caption: '',
    alt_text: ''
  });
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadAlbumDetails();
  }, [albumId]);

  const loadAlbumDetails = async () => {
    try {
      // 获取指定ID的相册信息
      const allAlbums = await albumService.getAlbums();
      const foundAlbum = allAlbums.find(a => a.id === albumId);
      
      if (!foundAlbum) {
        throw new Error('相册不存在或您没有访问权限');
      }
      
      setAlbum(foundAlbum);

      // 获取相册中的照片
      const photoData = await albumService.getPhotos(albumId);
      setPhotos(photoData);
    } catch (error: any) {
      console.error('Error loading album details:', error);
      toast.error(error.message || '加载相册详情失败');
      router.push('/dashboard/albums');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!newPhoto.url.trim()) {
      toast.error('请先上传照片');
      return;
    }

    try {
      await albumService.addPhoto(
        albumId,
        newPhoto.url,
        newPhoto.caption,
        newPhoto.alt_text
      );

      toast.success('照片添加成功');
      setShowAddPhotoDialog(false);
      setNewPhoto({ url: '', caption: '', alt_text: '' });
      loadAlbumDetails();
    } catch (error: any) {
      console.error('Error adding photo:', error);
      toast.error('添加照片失败: ' + error.message);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return;

    try {
      await albumService.updatePhoto(
        editingPhoto.id,
        albumId,
        {
          caption: editingPhoto.caption,
          alt_text: editingPhoto.alt_text
        }
      );

      toast.success('照片信息更新成功');
      setShowEditDialog(false);
      setEditingPhoto(null);
      loadAlbumDetails();
    } catch (error: any) {
      console.error('Error updating photo:', error);
      toast.error('更新照片信息失败: ' + error.message);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？此操作不可撤销。')) {
      return;
    }

    try {
      await albumService.deletePhoto(photoId, albumId);

      toast.success('照片删除成功');
      loadAlbumDetails();
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.error('删除照片失败: ' + error.message);
    }
  };

  const handleImageUpload = (url: string) => {
    setNewPhoto(prev => ({ ...prev, url }));
  };

  const handlePhotoEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setShowEditDialog(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">加载中...</div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">相册不存在或您没有访问权限</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          ← 返回相册列表
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{album.title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                {album.description || '暂无描述'}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              创建于 {new Date(album.created_at).toLocaleString()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            {album.cover_image ? (
              <img
                src={album.cover_image}
                alt={album.title}
                className="max-w-md rounded-lg shadow"
              />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-64 h-48 flex items-center justify-center">
                <span className="text-gray-500">暂无封面</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">相册照片 ({photos.length})</h2>
        <Dialog open={showAddPhotoDialog} onOpenChange={setShowAddPhotoDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> 添加照片
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加照片到相册</DialogTitle>
              <DialogDescription>
                上传并添加一张新照片到当前相册
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  照片 *
                </Label>
                <div className="col-span-3">
                  <ImageUpload
                    initialImageUrl={newPhoto.url}
                    onImageUpload={handleImageUpload}
                    bucketName="album-images"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="caption" className="text-right">
                  描述
                </Label>
                <Input
                  id="caption"
                  value={newPhoto.caption}
                  onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="altText" className="text-right">
                  替代文本
                </Label>
                <Input
                  id="altText"
                  value={newPhoto.alt_text}
                  onChange={(e) => setNewPhoto({ ...newPhoto, alt_text: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleAddPhoto}>添加照片</Button>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">该相册中还没有照片，点击上方按钮添加照片</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="relative group">
                <img
                  src={photo.url}
                  alt={photo.alt_text || photo.caption || '相册照片'}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePhotoEdit(photo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm truncate">{photo.caption || '未命名照片'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {photo.alt_text || '暂无替代文本'}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(photo.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 编辑照片对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑照片信息</DialogTitle>
            <DialogDescription>
              修改照片的描述和替代文本
            </DialogDescription>
          </DialogHeader>
          {editingPhoto && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editCaption" className="text-right">
                  描述
                </Label>
                <Input
                  id="editCaption"
                  value={editingPhoto.caption}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editAltText" className="text-right">
                  替代文本
                </Label>
                <Input
                  id="editAltText"
                  value={editingPhoto.alt_text}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, alt_text: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <Button onClick={handleUpdatePhoto}>保存更改</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}