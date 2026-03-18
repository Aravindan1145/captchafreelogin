# Smart Health Monitoring System

A comprehensive React-based health monitoring application that connects patients and healthcare providers for better medical outcomes and streamlined care management.

## 🏥 Features

### For Patients
- **Account Registration**: Apply for medical monitoring access with pending approval system
- **Health Dashboard**: View real-time health metrics (heart rate, temperature, blood pressure, oxygen levels)
- **Medical Reports**: Create, edit, and submit medical reports for doctor review
- **Report Management**: Track report status (draft, submitted, confirmed, rejected)
- **Health Activities**: Monitor recent checkups, medication reminders, and lab results

### For Doctors  
- **Patient Approvals**: Review and approve/reject patient applications
- **Report Reviews**: Confirm or reject patient medical reports with feedback
- **Dashboard Analytics**: View statistics on pending patients, approved patients, and pending reports
- **Medical Oversight**: Comprehensive patient management and care coordination

### System Features
- **Authentication System**: Separate login/signup for doctors and patients
- **Default Demo Accounts**: Pre-configured accounts for testing
- **Real-time Updates**: State management with Zustand
- **Beautiful UI**: Medical-themed design system with gradients and animations
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Report Editing**: Collaborative editing system for medical reports
- **Status Tracking**: Complete workflow from draft → submitted → confirmed/rejected

## 🔐 Demo Accounts

### Doctors (Default IDs)
- **DOC001** / password123 (Dr. Sarah Johnson - General Medicine)
- **DOC002** / password123 (Dr. Michael Chen - Cardiology)

### Patients (Default IDs)  
- **PAT001** / patient123 (John Smith - Approved)
- **PAT002** / patient123 (Emily Davis - Approved)

## 🚀 Getting Started

### Prerequisites
- Node.js & npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Installation
```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory  
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

## 🏗️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui with medical variants
- **State Management**: Zustand
- **Icons**: Lucide React
- **Notifications**: Sonner toasts

## 🎨 Design System

The application uses a comprehensive medical-themed design system:

### Color Palette
- **Medical Primary**: `hsl(220 90% 56%)` - Main brand color
- **Medical Secondary**: `hsl(268 83% 58%)` - Accent color
- **Health Status Colors**: Excellent (green), Good (lime), Fair (amber), Poor (red)
- **Medical Gradients**: Dynamic gradients for buttons and backgrounds

### Components
- Custom button variants (medical, medical-outline, success, warning, error)
- Medical-themed cards with hover effects
- Health metric displays with status indicators
- Report management interfaces

## 📋 Usage Workflow

### Patient Journey
1. Register for an account → Status: Pending
2. Wait for doctor approval → Status: Approved  
3. Access health dashboard with real-time metrics
4. Create and edit medical reports
5. Submit reports for doctor review
6. Receive feedback and confirmations

### Doctor Journey
1. Login with doctor credentials
2. Review pending patient applications
3. Approve/reject patient registrations
4. Review submitted medical reports
5. Confirm or reject reports with feedback
6. Monitor patient statistics and analytics

## 🔄 Report Management System

### Patient Capabilities
- **Create Reports**: Document symptoms, medical history
- **Edit Reports**: Modify reports when status allows
- **Submit for Review**: Send reports to doctors
- **Track Status**: Monitor approval workflow

### Doctor Capabilities  
- **Review Reports**: Examine patient submissions
- **Add Diagnoses**: Professional medical assessments
- **Confirm Reports**: Approve finalized reports
- **Reject with Feedback**: Send back for revisions

### Report Statuses
- **Draft**: Editable by patient
- **Submitted**: Awaiting doctor review
- **Confirmed**: Approved by doctor (read-only)
- **Rejected**: Sent back for patient revision

## 🔧 Development

### Project Structure
```
src/
├── components/medical/    # Medical-specific components
├── hooks/                # Custom React hooks (Auth, Reports)
├── data/                # Mock data and default accounts
├── types/               # TypeScript type definitions
└── components/ui/       # Reusable UI components
```

### Key Hooks
- **useAuth**: Authentication and user management
- **useReports**: Medical report management and workflow

## 📱 Responsive Features

- Mobile-first design approach
- Touch-friendly interface elements  
- Responsive grid layouts for all screen sizes
- Adaptive navigation and forms

## 🔒 Security Features

- Default secure credentials for demo accounts
- Role-based access control (patients vs doctors)
- Report editing permissions based on status and user role
- Secure state management

## 🚀 Deployment

Deploy your application using the Lovable platform:
1. Open [Lovable Project](https://lovable.dev/projects/d01758e8-3ee7-4f9d-82e6-7520702883e4)
2. Click Share → Publish

For custom domain setup, visit Project > Settings > Domains.

## 📚 Additional Resources

- [Lovable Documentation](https://docs.lovable.dev/)
- [Medical UI Design Guidelines](docs/design-system.md)
- [API Integration Guide](docs/api-integration.md)

---

**Healthcare Excellence**: *Care. Cure. Connect.*
