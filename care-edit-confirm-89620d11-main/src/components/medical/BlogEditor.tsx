import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Send } from 'lucide-react';
import type { BlogPost } from '@/types';

interface BlogEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blogData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'likes'>) => Promise<boolean>;
  onUpdate?: (blogId: string, blogData: Partial<BlogPost>) => Promise<boolean>;
  existingBlog?: BlogPost | null;
  doctorId: string;
  doctorName: string;
}

const categories = [
  { value: 'medical-activities', label: 'Recent Medical Activities' },
  { value: 'general-medicine', label: 'General Medicine Updates' },
  { value: 'organic-medicine', label: 'Organic & Preventive Healthcare' },
  { value: 'health-awareness', label: 'Health Awareness' },
];

export const BlogEditor = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  existingBlog,
  doctorId,
  doctorName,
}: BlogEditorProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<string>('health-awareness');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingBlog) {
      setTitle(existingBlog.title);
      setContent(existingBlog.content);
      setImageUrl(existingBlog.imageUrl || '');
      setCategory(existingBlog.category);
    } else {
      setTitle('');
      setContent('');
      setImageUrl('');
      setCategory('health-awareness');
    }
  }, [existingBlog, isOpen]);

  const handleSubmit = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const blogData = {
        doctorId,
        doctorName,
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        category: category as BlogPost['category'],
        isPublished: publish,
      };

      let success = false;
      if (existingBlog && onUpdate) {
        success = await onUpdate(existingBlog.id, blogData);
      } else {
        success = await onSave(blogData);
      }

      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter blog title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your blog content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isLoading || !title.trim() || !content.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isLoading || !title.trim() || !content.trim()}
              className="flex-1 bg-gradient-medical hover:opacity-90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
