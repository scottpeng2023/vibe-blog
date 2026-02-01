'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  initialImageUrl?: string;
  bucketName?: string;
}

export function ImageUpload({ 
  onImageUpload, 
  initialImageUrl, 
  bucketName = 'post-images' 
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();


  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择一张图片');
      return;
    }

    // 设置预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setFileName(file.name);

    try {
      // 生成唯一的文件名
      const fileExt = file.name.split('.').pop();
      const fileNameWithTimestamp = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // 上传文件到 Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileNameWithTimestamp, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        // 检查是否是存储桶不存在的错误
        if (error.message.includes('does not exist') || error.message.includes('Storage bucket does not exist')) {
          alert('存储桶不存在，请联系管理员创建名为 "' + bucketName + '" 的存储桶');
        } else if (error.message.includes('violates row-level security') || error.message.includes('permission denied')) {
          alert('上传失败：权限不足。请联系管理员检查存储策略。');
        } else {
          alert('上传图片失败：' + error.message);
        }
        return;
      }

      // 获取公开URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileNameWithTimestamp);

      if (urlData?.publicUrl) {
        onImageUpload(urlData.publicUrl);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('上传图片失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageUpload(''); // 通知父组件清空URL
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <Card className="border-2 border-dashed">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          {previewUrl ? (
            <div className="relative group w-full max-w-xs">
              <img 
                src={previewUrl} 
                alt="预览" 
                className="w-full h-48 object-cover rounded-md"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">点击下方按钮上传封面图片</p>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {previewUrl ? '更换图片' : '选择图片'}
            </Button>
            
            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                移除
              </Button>
            )}
          </div>
          
          {isUploading && (
            <p className="text-sm text-gray-500 mt-2">正在上传...</p>
          )}
          
          {fileName && (
            <p className="text-xs text-gray-500 mt-1 truncate max-w-full">{fileName}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}