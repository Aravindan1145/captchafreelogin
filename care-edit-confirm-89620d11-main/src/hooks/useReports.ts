import { create } from 'zustand';
import { MedicalReport } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportsStore {
  reports: MedicalReport[];
  isLoading: boolean;
  fetchPatientReports: (patientId: string) => Promise<void>;
  fetchDoctorReports: (doctorId: string) => Promise<void>;
  fetchPendingReports: () => Promise<void>;
  fetchReportById: (reportId: string) => Promise<MedicalReport | null>;
  getPatientReports: (patientId: string) => MedicalReport[];
  getDoctorReports: (doctorId: string) => MedicalReport[];
  getPendingReports: () => MedicalReport[];
  updateReport: (reportId: string, updates: Partial<MedicalReport>) => Promise<boolean>;
  createReport: (reportData: Omit<MedicalReport, 'id'> & { id?: string }) => Promise<string | null>;
  confirmReport: (reportId: string, doctorId: string, doctorName: string, doctorLicense: string) => Promise<boolean>;
  rejectReport: (reportId: string, doctorId: string, reason?: string) => Promise<boolean>;
}

export const useReports = create<ReportsStore>((set, get) => ({
  reports: [],
  isLoading: false,

  fetchPatientReports: async (patientId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { action: 'get-by-patient', patientId }
      });

      if (error) throw error;

      if (data.success) {
        set({ reports: data.reports || [] });
      }
    } catch (error) {
      console.error('Error fetching patient reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDoctorReports: async (doctorId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { action: 'get-by-doctor', doctorId }
      });

      if (error) throw error;

      if (data.success) {
        set({ reports: data.reports || [] });
      }
    } catch (error) {
      console.error('Error fetching doctor reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingReports: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { action: 'get-pending' }
      });

      if (error) throw error;

      if (data.success) {
        set({ reports: data.reports || [] });
      }
    } catch (error) {
      console.error('Error fetching pending reports:', error);
      toast.error('Failed to fetch pending reports');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchReportById: async (reportId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { action: 'get', reportId }
      });

      if (error) throw error;

      return data.success ? data.report : null;
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  },

  getPatientReports: (patientId) => {
    const { reports } = get();
    return reports.filter(report => report.patientId === patientId);
  },

  getDoctorReports: (doctorId) => {
    const { reports } = get();
    return reports.filter(report => report.doctorId === doctorId);
  },

  getPendingReports: () => {
    const { reports } = get();
    return reports.filter(report => report.status === 'submitted');
  },

  updateReport: async (reportId, updates) => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { 
          action: 'update', 
          reportId, 
          reportData: updates 
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        const { reports } = get();
        const updatedReports = reports.map(r => 
          r.id === reportId ? { ...r, ...updates } : r
        );
        set({ reports: updatedReports });
        toast.success('Report updated successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
      return false;
    }
  },

  createReport: async (reportData) => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { 
          action: 'create', 
          reportData: {
            ...reportData,
            status: reportData.status || 'draft',
            isEditable: true
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        // Add to local state
        const { reports } = get();
        set({ reports: [...reports, data.report] });
        toast.success('Report created successfully!');
        return data.report.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
      return null;
    }
  },

  confirmReport: async (reportId, doctorId, doctorName, doctorLicense) => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { 
          action: 'confirm', 
          reportId,
          confirmData: { doctorId, doctorName, doctorLicense }
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        const { reports } = get();
        const updatedReports = reports.map(r => 
          r.id === reportId ? { 
            ...r, 
            status: 'confirmed' as const, 
            isEditable: false,
            doctorId,
            doctorName,
            doctorLicense
          } : r
        );
        set({ reports: updatedReports });
        toast.success('Report confirmed successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error confirming report:', error);
      toast.error('Failed to confirm report');
      return false;
    }
  },

  rejectReport: async (reportId, doctorId, reason) => {
    try {
      const { data, error } = await supabase.functions.invoke('mongodb-reports', {
        body: { 
          action: 'reject', 
          reportId,
          rejectReason: reason
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        const { reports } = get();
        const updatedReports = reports.map(r => 
          r.id === reportId ? { ...r, status: 'rejected' as const, isEditable: true } : r
        );
        set({ reports: updatedReports });
        toast.success('Report has been rejected and sent back for revision.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error('Failed to reject report');
      return false;
    }
  }
}));
