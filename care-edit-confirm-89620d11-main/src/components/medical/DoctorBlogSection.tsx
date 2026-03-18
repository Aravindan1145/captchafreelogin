import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenSquare, RefreshCw } from 'lucide-react';
import { useBlogs } from '@/hooks/useBlogs';
import { BlogEditor } from './BlogEditor';
import { BlogCard } from './BlogCard';
import type { BlogPost, Doctor } from '@/types';

interface DoctorBlogSectionProps {
  doctor: Doctor;
}

export const DoctorBlogSection = ({ doctor }: DoctorBlogSectionProps) => {
  const { blogs, isLoading, fetchDoctorBlogs, createBlog, updateBlog, deleteBlog } = useBlogs();
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetchDoctorBlogs(doctor.id);
  }, [doctor.id]);

  const handleEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setShowEditor(true);
  };

  const handleDelete = async (blogId: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      await deleteBlog(blogId);
    }
  };

  const handleSave = async (blogData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'likes'>) => {
    const success = await createBlog(blogData);
    if (success) {
      fetchDoctorBlogs(doctor.id);
    }
    return success;
  };

  const handleUpdate = async (blogId: string, blogData: Partial<BlogPost>) => {
    const success = await updateBlog(blogId, blogData);
    if (success) {
      fetchDoctorBlogs(doctor.id);
    }
    return success;
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingBlog(null);
  };

  const publishedBlogs = blogs.filter(b => b.isPublished);
  const draftBlogs = blogs.filter(b => !b.isPublished);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PenSquare className="w-5 h-5" />
              My Health Blogs
            </CardTitle>
            <CardDescription>
              Share health tips and medical insights with patients
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDoctorBlogs(doctor.id)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowEditor(true)}
              className="bg-gradient-medical hover:opacity-90"
            >
              <PenSquare className="w-4 h-4 mr-2" />
              Create Blog
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && blogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading blogs...
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PenSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No blogs yet. Create your first blog post!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {draftBlogs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Drafts ({draftBlogs.length})
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {draftBlogs.map((blog) => (
                    <BlogCard
                      key={blog.id}
                      blog={blog}
                      currentUserId={doctor.id}
                      isDoctor={true}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
            {publishedBlogs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Published ({publishedBlogs.length})
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {publishedBlogs.map((blog) => (
                    <BlogCard
                      key={blog.id}
                      blog={blog}
                      currentUserId={doctor.id}
                      isDoctor={true}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <BlogEditor
        isOpen={showEditor}
        onClose={handleCloseEditor}
        onSave={handleSave}
        onUpdate={handleUpdate}
        existingBlog={editingBlog}
        doctorId={doctor.id}
        doctorName={doctor.name}
      />
    </Card>
  );
};
