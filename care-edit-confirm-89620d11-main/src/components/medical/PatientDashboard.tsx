import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Droplets,
  FileText,
  Calendar,
  Pill,
  Clock,
  Edit,
  Eye,
  LogOut,
  RefreshCw,
  Bell,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Key,
  CalendarDays,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { useNotifications } from '@/hooks/useNotifications';
import { useReportImages } from '@/hooks/useReportImages';
import { ChangePasswordModal } from './ChangePasswordModal';
import { HealthChatbot } from './HealthChatbot';
import { PatientBlogSection } from './PatientBlogSection';
import { PatientAppointmentBooking } from './PatientAppointmentBooking';
import { PatientAppointments } from './PatientAppointments';
import { generateMedicalReportPDF } from '@/utils/pdfGenerator';
import type { Patient, HealthMetrics, Doctor } from '@/types';
import { toast } from 'sonner';

interface PatientDashboardProps {
  onNavigateToReports: () => void;
}

export const PatientDashboard = ({ onNavigateToReports }: PatientDashboardProps) => {
  const { currentUser, logout, markPasswordChanged, approvedDoctors, fetchApprovedDoctors } = useAuth();
  const { reports, fetchPatientReports, isLoading } = useReports();
  const { notifications, fetchNotifications, markAsRead, unreadCount } = useNotifications();
  const { getReportImages } = useReportImages();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const patient = currentUser as Patient;

  useEffect(() => {
    if (patient?.id) {
      fetchPatientReports(patient.id);
      fetchNotifications(patient.id);
      fetchApprovedDoctors();
    }
  }, [patient?.id]);
  
  // Mock health metrics - in real app, this would come from IoT devices
  const [healthMetrics] = useState<HealthMetrics>({
    heartRate: 72,
    temperature: 98.6,
    bloodPressure: '120/80',
    oxygenLevel: 98
  });

  const getHealthStatus = (metric: keyof HealthMetrics, value: number | string) => {
    switch (metric) {
      case 'heartRate':
        if (typeof value === 'number') {
          if (value >= 60 && value <= 100) return { status: 'excellent', color: 'health-excellent' };
          if (value >= 50 && value <= 110) return { status: 'good', color: 'health-good' };
          return { status: 'fair', color: 'health-fair' };
        }
        break;
      case 'temperature':
        if (typeof value === 'number') {
          if (value >= 97.0 && value <= 99.0) return { status: 'excellent', color: 'health-excellent' };
          if (value >= 96.0 && value <= 100.4) return { status: 'good', color: 'health-good' };
          return { status: 'fair', color: 'health-fair' };
        }
        break;
      case 'oxygenLevel':
        if (typeof value === 'number') {
          if (value >= 95) return { status: 'excellent', color: 'health-excellent' };
          if (value >= 90) return { status: 'good', color: 'health-good' };
          return { status: 'poor', color: 'health-poor' };
        }
        break;
    }
    return { status: 'good', color: 'health-good' };
  };

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleDownloadPDF = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) {
      toast.error('Report not found');
      return;
    }

    if (report.status !== 'confirmed') {
      toast.error('PDF is only available for approved reports');
      return;
    }

    setDownloadingReportId(reportId);
    try {
      const images = await getReportImages(reportId);
      await generateMedicalReportPDF({ report, images });
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingReportId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (patient.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-health flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-medical">
          <CardHeader className="text-center">
            <Clock className="w-12 h-12 text-medical-warning mx-auto mb-4" />
            <CardTitle className="text-2xl text-medical-warning">Account Pending</CardTitle>
            <CardDescription>
              Your registration is being reviewed by our medical team
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Once approved, you'll have access to all health monitoring features.
            </p>
            <Button onClick={logout} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-health">
      {/* Header */}
      <div className="bg-white shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-medical bg-clip-text text-transparent">
                Health Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome back, {patient.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Change Password Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPasswordModal(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>

              {/* Notifications Bell */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="flex items-center justify-between p-3 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => setShowNotifications(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={`p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                            onClick={() => handleNotificationClick(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              {notification.type === 'approved' ? (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-muted-foreground">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Badge 
                variant="secondary" 
                className="bg-health-excellent text-white"
              >
                {patient.status}
              </Badge>
              <Button onClick={logout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="blogs" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Health Blogs
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0">
            {/* Notification Banner for unread notifications */}
            {unreadCount > 0 && (
              <div className="mb-6 p-4 bg-muted border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-medical-primary" />
                  <p className="text-foreground">
                    You have <strong>{unreadCount}</strong> new notification{unreadCount > 1 ? 's' : ''} about your reports
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNotifications(true)}
                >
                  View
                </Button>
              </div>
            )}

            {/* Health Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-card hover:shadow-card-hover transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                      <p className="text-3xl font-bold text-medical-primary">
                        {healthMetrics.heartRate} 
                        <span className="text-sm text-muted-foreground ml-1">bpm</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-health-excellent/10">
                      <Heart className="w-6 h-6 text-health-excellent" />
                    </div>
                  </div>
                  <Progress value={75} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                      <p className="text-3xl font-bold text-medical-primary">
                        {healthMetrics.temperature}
                        <span className="text-sm text-muted-foreground ml-1">°F</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-health-excellent/10">
                      <Thermometer className="w-6 h-6 text-health-excellent" />
                    </div>
                  </div>
                  <Progress value={85} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                      <p className="text-3xl font-bold text-medical-primary">
                        {healthMetrics.bloodPressure}
                        <span className="text-sm text-muted-foreground ml-1">mmHg</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-health-excellent/10">
                      <Activity className="w-6 h-6 text-health-excellent" />
                    </div>
                  </div>
                  <Progress value={90} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Oxygen Level</p>
                      <p className="text-3xl font-bold text-medical-primary">
                        {healthMetrics.oxygenLevel}
                        <span className="text-sm text-muted-foreground ml-1">%</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-health-excellent/10">
                      <Droplets className="w-6 h-6 text-health-excellent" />
                    </div>
                  </div>
                  <Progress value={95} className="mt-3" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Reports */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-medical-primary" />
                    Medical Reports
                  </CardTitle>
                  <CardDescription>
                    Your recent medical reports and their status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-medical-primary" />
                      <p className="text-muted-foreground">Loading reports...</p>
                    </div>
                  ) : reports.length > 0 ? (
                    <>
                      {reports.slice(0, 3).map((report) => (
                        <div 
                          key={report.id} 
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{report.date}</p>
                            <p className="text-sm text-muted-foreground">
                              {report.doctorName || 'No doctor assigned'}
                            </p>
                            <Badge 
                              variant={
                                report.status === 'confirmed' ? 'default' :
                                report.status === 'submitted' ? 'secondary' :
                                report.status === 'rejected' ? 'destructive' : 'outline'
                              }
                              className="mt-1"
                            >
                              {report.status}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            {report.status === 'confirmed' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadPDF(report.id)}
                                disabled={downloadingReportId === report.id}
                                className="text-health-excellent border-health-excellent hover:bg-health-excellent/10"
                              >
                                {downloadingReportId === report.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            {report.isEditable && (
                              <Button size="sm" variant="outline" onClick={onNavigateToReports}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={onNavigateToReports}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={onNavigateToReports}
                      >
                        View All Reports
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No medical reports yet</p>
                      <Button 
                        className="mt-4 bg-gradient-medical"
                        onClick={onNavigateToReports}
                      >
                        Create New Report
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-medical-primary" />
                    Recent Activities
                  </CardTitle>
                  <CardDescription>
                    Your latest health monitoring activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-health-excellent mr-3" />
                        <div>
                          <p className="text-sm font-medium">Last Checkup</p>
                          <p className="text-xs text-muted-foreground">Regular health monitoring</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">2 days ago</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center">
                        <Pill className="w-4 h-4 text-medical-warning mr-3" />
                        <div>
                          <p className="text-sm font-medium">Medication Reminder</p>
                          <p className="text-xs text-muted-foreground">Daily prescription</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Today</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center">
                        <Activity className="w-4 h-4 text-health-good mr-3" />
                        <div>
                          <p className="text-sm font-medium">Lab Results</p>
                          <p className="text-xs text-muted-foreground">Blood work completed</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">1 week ago</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PatientAppointmentBooking approvedDoctors={approvedDoctors as Doctor[]} />
              <PatientAppointments patientId={patient.id} />
            </div>
          </TabsContent>

          {/* Blogs Tab */}
          <TabsContent value="blogs" className="mt-0">
            <PatientBlogSection patient={patient} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userId={patient.id}
        onPasswordChanged={markPasswordChanged}
      />

      {/* Health Chatbot */}
      <HealthChatbot patientName={patient.name} />
    </div>
  );
};