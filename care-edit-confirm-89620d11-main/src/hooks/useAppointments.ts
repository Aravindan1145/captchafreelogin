import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Appointment, DoctorAvailability, TimeSlot, AppointmentStatus } from '@/types';

interface AppointmentsStore {
  appointments: Appointment[];
  doctorAvailability: DoctorAvailability[];
  availableDoctors: DoctorAvailability[];
  isLoading: boolean;
  
  // Availability actions
  setAvailability: (doctorId: string, date: string, timeSlots: TimeSlot[], isOnlineAvailable: boolean, isOfflineAvailable: boolean) => Promise<void>;
  getAvailability: (doctorId: string, startDate?: string, endDate?: string) => Promise<DoctorAvailability[]>;
  getAvailableDoctors: (date: string) => Promise<DoctorAvailability[]>;
  deleteAvailability: (doctorId: string, date: string) => Promise<void>;
  
  // Appointment actions
  createAppointment: (data: {
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    doctorSpecialization: string;
    date: string;
    timeSlot: TimeSlot;
    mode: 'online' | 'offline';
    notes?: string;
  }) => Promise<Appointment | null>;
  getPatientAppointments: (patientId: string) => Promise<void>;
  getDoctorAppointments: (doctorId: string, status?: AppointmentStatus) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, zoomUrl?: string) => Promise<void>;
  setZoomUrl: (appointmentId: string, zoomUrl: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
}

export const useAppointments = create<AppointmentsStore>((set, get) => ({
  appointments: [],
  doctorAvailability: [],
  availableDoctors: [],
  isLoading: false,

  setAvailability: async (doctorId, date, timeSlots, isOnlineAvailable, isOfflineAvailable) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'set-availability',
          doctorId,
          date,
          timeSlots,
          isOnlineAvailable,
          isOfflineAvailable
        }
      });

      if (error) throw error;
      toast.success('Availability updated successfully');
      
      // Refresh availability
      await get().getAvailability(doctorId);
    } catch (error: any) {
      console.error('Error setting availability:', error);
      toast.error('Failed to set availability');
    } finally {
      set({ isLoading: false });
    }
  },

  getAvailability: async (doctorId, startDate, endDate) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'get-availability',
          doctorId,
          startDate,
          endDate
        }
      });

      if (error) throw error;
      const availability = data.documents || [];
      set({ doctorAvailability: availability });
      return availability;
    } catch (error: any) {
      console.error('Error getting availability:', error);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  getAvailableDoctors: async (date) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'get-all-available-doctors',
          date
        }
      });

      if (error) throw error;
      const doctors = data.documents || [];
      set({ availableDoctors: doctors });
      return doctors;
    } catch (error: any) {
      console.error('Error getting available doctors:', error);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAvailability: async (doctorId, date) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'delete-availability',
          doctorId,
          date
        }
      });

      if (error) throw error;
      toast.success('Availability removed');
      await get().getAvailability(doctorId);
    } catch (error: any) {
      console.error('Error deleting availability:', error);
      toast.error('Failed to delete availability');
    } finally {
      set({ isLoading: false });
    }
  },

  createAppointment: async (appointmentData) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'create-appointment',
          ...appointmentData
        }
      });

      if (error) throw error;
      toast.success('Appointment booked successfully');
      return data.appointment;
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to book appointment');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  getPatientAppointments: async (patientId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'get-patient-appointments',
          patientId
        }
      });

      if (error) throw error;
      set({ appointments: data.documents || [] });
    } catch (error: any) {
      console.error('Error getting patient appointments:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getDoctorAppointments: async (doctorId, status) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'get-doctor-appointments',
          doctorId,
          status
        }
      });

      if (error) throw error;
      set({ appointments: data.documents || [] });
    } catch (error: any) {
      console.error('Error getting doctor appointments:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateAppointmentStatus: async (appointmentId, status, zoomUrl) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'update-appointment-status',
          appointmentId,
          status,
          zoomUrl
        }
      });

      if (error) throw error;
      
      // Update local state
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === appointmentId ? { ...apt, status, zoomUrl: zoomUrl || apt.zoomUrl } : apt
        )
      }));
      
      toast.success(`Appointment ${status}`);
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    } finally {
      set({ isLoading: false });
    }
  },

  setZoomUrl: async (appointmentId, zoomUrl) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'set-zoom-url',
          appointmentId,
          zoomUrl
        }
      });

      if (error) throw error;
      
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === appointmentId ? { ...apt, zoomUrl } : apt
        )
      }));
      
      toast.success('Zoom link added successfully');
    } catch (error: any) {
      console.error('Error setting zoom URL:', error);
      toast.error('Failed to add Zoom link');
    } finally {
      set({ isLoading: false });
    }
  },

  cancelAppointment: async (appointmentId) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.functions.invoke('mongodb-appointments', {
        body: {
          action: 'cancel-appointment',
          appointmentId
        }
      });

      if (error) throw error;
      
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
        )
      }));
      
      toast.success('Appointment cancelled');
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      set({ isLoading: false });
    }
  }
}));
