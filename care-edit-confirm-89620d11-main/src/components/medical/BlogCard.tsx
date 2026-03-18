import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Calendar, User, Edit, Trash2, Eye } from 'lucide-react';
import type { BlogPost } from '@/types';

interface BlogCardProps {
  blog: BlogPost;
  currentUserId: string;
  isDoctor?: boolean;
  onLike?: (blogId: string) => void;
  onUnlike?: (blogId: string) => void;
  onEdit?: (blog: BlogPost) => void;
  onDelete?: (blogId: string) => void;
}

const categoryLabels: Record<string, string> = {
  'medical-activities': 'Medical Activities',
  'general-medicine': 'General Medicine',
  'organic-medicine': 'Organic Medicine',
  'health-awareness': 'Health Awareness',
};

const categoryColors: Record<string, string> = {
  'medical-activities': 'bg-blue-100 text-blue-800',
  'general-medicine': 'bg-green-100 text-green-800',
  'organic-medicine': 'bg-amber-100 text-amber-800',
  'health-awareness': 'bg-purple-100 text-purple-800',
};

export const BlogCard = ({
  blog,
  currentUserId,
  isDoctor = false,
  onLike,
  onUnlike,
  onEdit,
  onDelete,
}: BlogCardProps) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isLiked = blog.likes.includes(currentUserId);
  const likeCount = blog.likes.length;
  const isOwner = blog.doctorId === currentUserId;

  const handleLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked && onUnlike) {
        await onUnlike(blog.id);
      } else if (!isLiked && onLike) {
        await onLike(blog.id);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const truncateContent = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {blog.imageUrl && (
          <div className="h-48 overflow-hidden">
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Badge className={categoryColors[blog.category] || 'bg-gray-100 text-gray-800'}>
                {categoryLabels[blog.category] || blog.category}
              </Badge>
              {!blog.isPublished && (
                <Badge variant="outline" className="ml-2">Draft</Badge>
              )}
            </div>
            {isDoctor && isOwner && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit?.(blog)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete?.(blog.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold mt-2 line-clamp-2">{blog.title}</h3>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-muted-foreground text-sm">
            {truncateContent(blog.content)}
          </p>
          {blog.content.length > 150 && (
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => setShowFullContent(true)}
            >
              <Eye className="w-3 h-3 mr-1" />
              Read more
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Dr. {blog.doctorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(blog.publishedAt || blog.createdAt)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1 ${isLiked ? 'text-red-500' : ''}`}
            onClick={handleLikeToggle}
            disabled={isLiking}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount}
          </Button>
        </CardFooter>
      </Card>

      {/* Full Content Dialog */}
      <Dialog open={showFullContent} onOpenChange={setShowFullContent}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={categoryColors[blog.category] || 'bg-gray-100 text-gray-800'}>
                {categoryLabels[blog.category] || blog.category}
              </Badge>
            </div>
            <DialogTitle className="text-xl">{blog.title}</DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Dr. {blog.doctorName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.publishedAt || blog.createdAt)}
              </span>
            </div>
          </DialogHeader>
          {blog.imageUrl && (
            <div className="rounded-lg overflow-hidden my-4">
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full object-cover max-h-64"
              />
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{blog.content}</p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLikeToggle}
              disabled={isLiking}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
