import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { BlogPost } from '@/types';

interface BlogStore {
  blogs: BlogPost[];
  isLoading: boolean;
  fetchAllBlogs: () => Promise<void>;
  fetchDoctorBlogs: (doctorId: string) => Promise<void>;
  createBlog: (blogData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'likes'>) => Promise<boolean>;
  updateBlog: (blogId: string, blogData: Partial<BlogPost>) => Promise<boolean>;
  deleteBlog: (blogId: string) => Promise<boolean>;
  likeBlog: (blogId: string, userId: string) => Promise<boolean>;
  unlikeBlog: (blogId: string, userId: string) => Promise<boolean>;
}

export const useBlogs = create<BlogStore>((set, get) => ({
  blogs: [],
  isLoading: false,

  fetchAllBlogs: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-blogs', {
        body: { action: 'get-all' }
      });

      if (error) {
        console.error('Fetch blogs error:', error);
        toast.error('Failed to fetch blogs');
        return;
      }

      if (data?.success) {
        set({ blogs: data.blogs || [] });
      }
    } catch (error) {
      console.error('Fetch blogs error:', error);
      toast.error('An error occurred while fetching blogs');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDoctorBlogs: async (doctorId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-blogs', {
        body: { action: 'get-by-doctor', doctorId }
      });

      if (error) {
        console.error('Fetch doctor blogs error:', error);
        toast.error('Failed to fetch your blogs');
        return;
      }

      if (data?.success) {
        set({ blogs: data.blogs || [] });
      }
    } catch (error) {
      console.error('Fetch doctor blogs error:', error);
      toast.error('An error occurred while fetching blogs');
    } finally {
      set({ isLoading: false });
    }
  },

  createBlog: async (blogData) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-blogs', {
        body: { action: 'create', blogData }
      });

      if (error) {
        console.error('Create blog error:', error);
        toast.error('Failed to create blog');
        return false;
      }

      if (data?.success) {
        toast.success(blogData.isPublished ? 'Blog published successfully!' : 'Blog saved as draft');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Create blog error:', error);
      toast.error('An error occurred while creating blog');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateBlog: async (blogId, blogData) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-blogs', {
        body: { action: 'update', blogId, blogData }
      });

      if (error) {
        console.error('Update blog error:', error);
        toast.error('Failed to update blog');
        return false;
      }

      if (data?.success) {
        toast.success('Blog updated successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update blog error:', error);
      toast.error('An error occurred while updating blog');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBlog: async (blogId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-blogs', {
        body: { action: 'delete', blogId }
      });

      if (error) {
        console.error('Delete blog error:', error);
        toast.error('Failed to delete blog');
        return false;
      }

      if (data?.success) {
        set({ blogs: get().blogs.filter(b => b.id !== blogId) });
        toast.success('Blog deleted successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete blog error:', error);
      toast.error('An error occurred while deleting blog');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  likeBlog: async (blogId, userId) => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-blogs', {
        body: { action: 'like', blogId, userId }
      });

      if (error) {
        console.error('Like blog error:', error);
        return false;
      }

      if (data?.success) {
        // Update local state
        set({
          blogs: get().blogs.map(blog =>
            blog.id === blogId
              ? { ...blog, likes: [...blog.likes, userId] }
              : blog
          )
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Like blog error:', error);
      return false;
    }
  },

  unlikeBlog: async (blogId, userId) => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-blogs', {
        body: { action: 'unlike', blogId, userId }
      });

      if (error) {
        console.error('Unlike blog error:', error);
        return false;
      }

      if (data?.success) {
        // Update local state
        set({
          blogs: get().blogs.map(blog =>
            blog.id === blogId
              ? { ...blog, likes: blog.likes.filter(id => id !== userId) }
              : blog
          )
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unlike blog error:', error);
      return false;
    }
  },
}));
