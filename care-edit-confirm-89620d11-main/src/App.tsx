import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthPage } from './components/medical/AuthPage';
import { PatientDashboard } from './components/medical/PatientDashboard';
import { DoctorDashboard } from './components/medical/DoctorDashboard';
import { AdminDashboard } from './components/medical/AdminDashboard';
import { ReportsList } from './components/medical/ReportsList';
import { ReportEditor } from './components/medical/ReportEditor';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient();

type AppView = 'dashboard' | 'reports' | 'edit-report' | 'new-report';

const App = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>();

  const handleNavigateToReports = () => {
    setCurrentView('reports');
    setSelectedReportId(undefined);
  };

  const handleEditReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentView('edit-report');
  };

  const handleCreateReport = () => {
    setSelectedReportId(undefined);
    setCurrentView('new-report');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedReportId(undefined);
  };

  const handleBackToReports = () => {
    setCurrentView('reports');
    setSelectedReportId(undefined);
  };

  const renderView = () => {
    if (!isAuthenticated || !currentUser) {
      return <AuthPage />;
    }

    switch (currentView) {
      case 'reports':
        return (
          <ReportsList
            onBack={handleBackToDashboard}
            onEditReport={handleEditReport}
            onCreateReport={handleCreateReport}
          />
        );
      
      case 'edit-report':
      case 'new-report':
        return (
          <ReportEditor
            onBack={currentView === 'edit-report' ? handleBackToReports : handleBackToDashboard}
            reportId={selectedReportId}
          />
        );
      
      default:
        if (currentUser.type === 'admin') {
          return <AdminDashboard />;
        }
        return currentUser.type === 'patient' ? (
          <PatientDashboard onNavigateToReports={handleNavigateToReports} />
        ) : (
          <DoctorDashboard onNavigateToReports={handleNavigateToReports} />
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen">
          {renderView()}
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
