import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'approved' | 'rejected';
  message: string;
  reportId: string;
  read: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (patientId: string): Promise<Notification[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { action: 'get-notifications', patientId }
      });

      if (error) throw error;

      if (data.success) {
        setNotifications(data.notifications || []);
        return data.notifications || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { action: 'mark-notification-read', notificationId }
      });

      if (error) throw error;

      if (data.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    unreadCount,
  };
};
