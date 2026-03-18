import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReportImage } from '@/types';
import { toast } from 'sonner';

export const useReportImages = () => {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const uploadImage = async (reportId: string, file: File): Promise<ReportImage | null> => {
    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('mongodb-images', {
        body: {
          action: 'upload',
          reportId,
          imageData,
          imageName: file.name,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Image uploaded successfully!');
        return {
          id: data.imageId,
          imageName: file.name,
          imageData,
          createdAt: new Date(),
        };
      }
      throw new Error(data.error || 'Upload failed');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const getReportImages = async (reportId: string): Promise<ReportImage[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-images', {
        body: {
          action: 'get',
          reportId,
        },
      });

      if (error) throw error;

      if (data.success) {
        return data.images;
      }
      return [];
    } catch (error) {
      console.error('Get images error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-images', {
        body: {
          action: 'delete',
          imageId,
          reportId: '', // Not needed for delete
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Image deleted');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
      return false;
    }
  };

  return {
    uploadImage,
    getReportImages,
    deleteImage,
    uploading,
    loading,
  };
};
