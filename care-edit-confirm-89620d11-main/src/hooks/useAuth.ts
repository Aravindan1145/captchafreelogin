import { create } from 'zustand';
import { Doctor, Patient, Admin } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PendingDoctor {
  _id: string;
  name: string;
  email: string;
  specialization?: string;
  licenseNumber?: string;
  registeredAt: string;
}

interface PendingPatient {
  _id: string;
  name: string;
  email: string;
  registeredAt: string;
}

interface ApprovedDoctor {
  id: string;
  name: string;
  specialization?: string;
  licenseNumber?: string;
}

interface AuthStore {
  currentUser: Doctor | Patient | Admin | null;
  isAuthenticated: boolean;
  pendingDoctors: PendingDoctor[];
  pendingPatients: PendingPatient[];
  approvedDoctors: ApprovedDoctor[];
  isLoading: boolean;
  login: (userType: 'doctor' | 'patient' | 'admin', credentials: { id: string; password: string }) => Promise<boolean>;
  logout: () => void;
  registerDoctor: (doctorData: { name: string; email: string; specialization: string; licenseNumber: string }) => Promise<boolean>;
  registerPatient: (patientData: { name: string; email: string }) => Promise<boolean>;
  fetchPendingUsers: () => Promise<void>;
  fetchApprovedDoctors: () => Promise<void>;
  approveUser: (userId: string, userType: 'doctor' | 'patient') => Promise<boolean>;
  rejectUser: (userId: string, userType: 'doctor' | 'patient') => Promise<boolean>;
  markPasswordChanged: () => void;
}

export const useAuth = create<AuthStore>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  pendingDoctors: [],
  pendingPatients: [],
  approvedDoctors: [],
  isLoading: false,

  login: async (userType, credentials) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-users', {
        body: {
          action: 'login',
          userType,
          credentials
        }
      });

      if (error) {
        console.error('Login error:', error);
        toast.error('Login failed. Please try again.');
        return false;
      }

      if (data?.success) {
        const user = {
          ...data.user,
          type: data.userType
        };
        set({ currentUser: user, isAuthenticated: true });
        toast.success(`Welcome back, ${data.user.name}!`);
        return true;
      } else {
        toast.error(data?.message || 'Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false });
    toast.success('Logged out successfully');
  },

  registerDoctor: async (doctorData) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-users', {
        body: {
          action: 'register',
          userType: 'doctor',
          userData: doctorData
        }
      });

      if (error) {
        console.error('Registration error:', error);
        toast.error('Registration failed. Please try again.');
        return false;
      }

      if (data?.success) {
        toast.success('Doctor application submitted! You will receive credentials via email once approved.');
        return true;
      } else {
        toast.error(data?.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  registerPatient: async (patientData) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-users', {
        body: {
          action: 'register',
          userType: 'patient',
          userData: patientData
        }
      });

      if (error) {
        console.error('Registration error:', error);
        toast.error('Registration failed. Please try again.');
        return false;
      }

      if (data?.success) {
        toast.success('Application submitted! You will receive credentials via email once approved.');
        return true;
      } else {
        toast.error(data?.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingUsers: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-users', {
        body: { action: 'get-pending' }
      });

      if (error) {
        console.error('Fetch pending error:', error);
        return;
      }

      if (data?.success) {
        set({
          pendingDoctors: data.pendingDoctors || [],
          pendingPatients: data.pendingPatients || []
        });
      }
    } catch (error) {
      console.error('Fetch pending error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchApprovedDoctors: async () => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-users', {
        body: { action: 'get-approved-doctors' }
      });

      if (error) {
        console.error('Fetch doctors error:', error);
        return;
      }

      if (data?.success) {
        set({ approvedDoctors: data.doctors || [] });
      }
    } catch (error) {
      console.error('Fetch doctors error:', error);
    }
  },

  approveUser: async (userId, userType) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-users', {
        body: {
          action: 'approve',
          userId,
          userType
        }
      });

      if (error) {
        console.error('Approve error:', error);
        toast.error('Failed to approve user. Please try again.');
        return false;
      }

      if (data?.success) {
        toast.success(`${userType === 'doctor' ? 'Doctor' : 'Patient'} approved! Credentials sent via email.`);
        await get().fetchPendingUsers();
        return true;
      } else {
        toast.error(data?.error || 'Approval failed');
        return false;
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('An error occurred during approval');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  rejectUser: async (userId, userType) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-users', {
        body: {
          action: 'reject',
          userId,
          userType
        }
      });

      if (error) {
        console.error('Reject error:', error);
        toast.error('Failed to reject user. Please try again.');
        return false;
      }

      if (data?.success) {
        toast.success('Registration rejected.');
        await get().fetchPendingUsers();
        return true;
      } else {
        toast.error(data?.error || 'Rejection failed');
        return false;
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('An error occurred during rejection');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  markPasswordChanged: () => {
    const { currentUser } = get();
    if (currentUser && currentUser.type !== 'admin') {
      set({
        currentUser: {
          ...currentUser,
          passwordChanged: true
        } as Doctor | Patient
      });
    }
  }
}));
