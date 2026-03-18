import { Doctor, Patient, MedicalReport, Admin } from '@/types';

// Default admin account
export const defaultAdmin: Admin = {
  id: 'ADMIN001',
  password: 'admin123',
  name: 'System Administrator',
  type: 'admin'
};

// Default doctor accounts (approved)
export const defaultDoctors: Doctor[] = [
  {
    id: 'DOC001',
    password: 'password123',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@medical.com',
    age: 42,
    dob: '1982-03-15',
    gender: 'Female',
    license: 'DOC001',
    licenseNumber: 'LIC-2020-001',
    experience: 15,
    specialization: 'General Medicine',
    phone: '+1-555-0101',
    status: 'approved',
    type: 'doctor'
  },
  {
    id: 'DOC002',
    password: 'password123',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@medical.com',
    age: 38,
    dob: '1985-07-22',
    gender: 'Male',
    license: 'DOC002',
    licenseNumber: 'LIC-2018-042',
    experience: 12,
    specialization: 'Cardiology',
    phone: '+1-555-0102',
    status: 'approved',
    type: 'doctor'
  }
];

// Pending doctor applications
export const pendingDoctors: Doctor[] = [
  {
    id: 'DOC003',
    password: 'doctor123',
    name: 'Dr. Amanda Rodriguez',
    email: 'amanda.rodriguez@example.com',
    age: 35,
    dob: '1989-04-12',
    gender: 'Female',
    license: 'DOC003',
    licenseNumber: 'LIC-2022-089',
    experience: 8,
    specialization: 'Pediatrics',
    phone: '+1-555-0103',
    status: 'pending',
    submissionDate: '2024-09-14',
    type: 'doctor'
  }
];

// Default patient accounts (approved)
export const defaultPatients: Patient[] = [
  {
    id: 'PAT001',
    password: 'patient123',
    name: 'John Smith',
    email: 'john.smith@example.com',
    age: 39,
    dob: '1985-01-15',
    gender: 'Male',
    phone: '+1234567890',
    contactNumber: '+1234567890',
    status: 'approved',
    medicalConditions: 'Hypertension, managed with medication',
    type: 'patient'
  },
  {
    id: 'PAT002',
    password: 'patient123',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    age: 28,
    dob: '1996-05-10',
    gender: 'Female',
    phone: '+1987654321',
    contactNumber: '+1987654321',
    status: 'approved',
    medicalConditions: 'No known medical conditions',
    type: 'patient'
  }
];

// Pending patient applications
export const pendingPatients: Patient[] = [
  {
    id: 'PAT003',
    password: 'patient123',
    name: 'Robert Wilson',
    email: 'robert.wilson@example.com',
    age: 45,
    dob: '1979-08-20',
    gender: 'Male',
    phone: '+1555123456',
    contactNumber: '+1555123456',
    medicalConditions: 'Diabetes Type 2, taking metformin',
    status: 'pending',
    submissionDate: '2024-09-14',
    type: 'patient'
  },
  {
    id: 'PAT004',
    password: 'patient123',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    age: 33,
    dob: '1991-12-03',
    gender: 'Female',
    phone: '+1555987654',
    contactNumber: '+1555987654',
    medicalConditions: 'Asthma, uses inhaler as needed',
    status: 'pending',
    submissionDate: '2024-09-15',
    type: 'patient'
  }
];

// Medical reports
export const defaultReports: MedicalReport[] = [
  {
    id: 'REP001',
    patientId: 'PAT001',
    patientName: 'John Smith',
    doctorId: 'DOC001',
    doctorName: 'Dr. Sarah Johnson',
    date: '2024-09-16',
    symptoms: [
      'Mild headache and fatigue',
      'Occasional dizziness',
      'Sleep disturbances'
    ],
    diagnosis: [
      'Stress-related fatigue syndrome',
      'Mild dehydration',
      'Recommended lifestyle changes'
    ],
    testsconducted: [
      'Complete Blood Count (CBC) - Normal',
      'Blood Pressure Monitoring - 120/80 mmHg',
      'Heart Rate Variability - Within normal range'
    ],
    treatmentPlan: [
      'Increase daily water intake to 8-10 glasses',
      'Regular exercise - 30 minutes daily',
      'Stress management techniques',
      'Follow-up appointment in 2 weeks'
    ],
    additionalNotes: 'Patient is advised to maintain a balanced diet and ensure adequate sleep. Continue monitoring symptoms and report any worsening conditions immediately.',
    status: 'submitted',
    isEditable: true
  },
  {
    id: 'REP002',
    patientId: 'PAT002',
    patientName: 'Emily Davis',
    doctorId: 'DOC002',
    doctorName: 'Dr. Michael Chen',
    date: '2024-09-10',
    symptoms: [
      'Chest tightness during exercise',
      'Shortness of breath',
      'Rapid heartbeat'
    ],
    diagnosis: [
      'Exercise-induced bronchospasm',
      'Mild cardiovascular deconditioning',
      'Recommendation for pulmonary function tests'
    ],
    testsconducted: [
      'Electrocardiogram (ECG) - Normal sinus rhythm',
      'Chest X-ray - Clear lung fields',
      'Spirometry - Mild obstruction pattern'
    ],
    treatmentPlan: [
      'Inhaled bronchodilator before exercise',
      'Gradual increase in exercise intensity',
      'Cardiopulmonary rehabilitation program',
      'Follow-up in 4 weeks'
    ],
    additionalNotes: 'Patient shows good response to bronchodilator therapy. Advised to carry rescue inhaler during physical activities.',
    status: 'confirmed',
    isEditable: false
  }
];
