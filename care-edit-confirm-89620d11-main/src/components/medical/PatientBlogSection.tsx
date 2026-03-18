import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useBlogs } from '@/hooks/useBlogs';
import { BlogCard } from './BlogCard';
import type { Patient } from '@/types';

interface PatientBlogSectionProps {
  patient: Patient;
}

export const PatientBlogSection = ({ patient }: PatientBlogSectionProps) => {
  const { blogs, isLoading, fetchAllBlogs, likeBlog, unlikeBlog } = useBlogs();

  useEffect(() => {
    fetchAllBlogs();
  }, []);

  const handleLike = async (blogId: string) => {
    await likeBlog(blogId, patient.id);
  };

  const handleUnlike = async (blogId: string) => {
    await unlikeBlog(blogId, patient.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Health Blogs
            </CardTitle>
            <CardDescription>
              Read health tips and insights from our doctors
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAllBlogs()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && blogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading blogs...
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No health blogs available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                blog={blog}
                currentUserId={patient.id}
                isDoctor={false}
                onLike={handleLike}
                onUnlike={handleUnlike}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
