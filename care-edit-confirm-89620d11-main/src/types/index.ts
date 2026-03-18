export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  password: string;
}

export interface Doctor extends User {
  license: string;
  licenseNumber: string;
  experience: number;
  specialization: string;
  status?: 'pending' | 'approved' | 'rejected';
  submissionDate?: string;
  type: 'doctor';
  passwordChanged?: boolean;
}

export interface Patient extends User {
  medicalConditions: string;
  contactNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  submissionDate?: string;
  type: 'patient';
  passwordChanged?: boolean;
}

export interface Admin {
  id: string;
  password: string;
  name: string;
  type: 'admin';
}

export interface HealthMetrics {
  heartRate: number;
  temperature: number;
  bloodPressure: string;
  oxygenLevel: number;
}

export interface ReportImage {
  id: string;
  imageName: string;
  imageData: string;
  createdAt: Date;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  doctorLicense?: string;
  date: string;
  symptoms: string[];
  diagnosis: string[];
  testsconducted: string[];
  treatmentPlan: string[];
  additionalNotes: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'rejected';
  isEditable: boolean;
  images?: ReportImage[];
}

export interface AuthState {
  currentUser: Doctor | Patient | Admin | null;
  isAuthenticated: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface BlogPost {
  id: string;
  doctorId: string;
  doctorName: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: 'medical-activities' | 'general-medicine' | 'organic-medicine' | 'health-awareness';
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  likes: string[]; // Array of user IDs who liked
  isPublished: boolean;
}

// Appointment Types
export type AppointmentMode = 'online' | 'offline';
export type AppointmentStatus = 'pending' | 'approved' | 'live' | 'completed' | 'cancelled';

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD format
  timeSlots: TimeSlot[];
  isOnlineAvailable: boolean;
  isOfflineAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string; // YYYY-MM-DD format
  timeSlot: TimeSlot;
  mode: AppointmentMode;
  status: AppointmentStatus;
  zoomUrl?: string; // Manually entered by doctor
  notes?: string;
  createdAt: string;
  updatedAt: string;
}