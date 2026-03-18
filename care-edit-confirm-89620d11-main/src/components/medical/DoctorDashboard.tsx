import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  CheckCircle, 
  LogOut,
  Eye,
  UserX,
  Stethoscope,
  Image as ImageIcon,
  Activity,
  FileCheck,
  RefreshCw,
  Key,
  CalendarDays,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { useReportImages } from '@/hooks/useReportImages';
import { DoctorBlogSection } from './DoctorBlogSection';
import { DoctorAvailabilityManager } from './DoctorAvailabilityManager';
import { DoctorAppointments } from './DoctorAppointments';
import { ChangePasswordModal } from './ChangePasswordModal';
import type { Doctor, MedicalReport, ReportImage } from '@/types';

interface DoctorDashboardProps {
  onNavigateToReports: () => void;
}

export const DoctorDashboard = ({ onNavigateToReports }: DoctorDashboardProps) => {
  const { currentUser, logout, markPasswordChanged } = useAuth();
  const { reports, fetchPendingReports, confirmReport, rejectReport, isLoading } = useReports();
  const { getReportImages, loading: imagesLoading } = useReportImages();
  
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [reportImages, setReportImages] = useState<ReportImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const doctor = currentUser as Doctor;
  const pendingReports = reports.filter(r => r.status === 'submitted');

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const handleViewReport = async (report: MedicalReport) => {
    setSelectedReport(report);
    // Load images for this report
    const images = await getReportImages(report.id);
    setReportImages(images);
  };

  const handleConfirmReport = async (reportId: string) => {
    await confirmReport(reportId, doctor.id, doctor.name, doctor.license || doctor.licenseNumber || 'N/A');
    setSelectedReport(null);
    fetchPendingReports();
  };

  const handleRejectReport = async (reportId: string) => {
    await rejectReport(reportId, doctor.id, "Report needs additional information");
    setSelectedReport(null);
    fetchPendingReports();
  };

  return (
    <div className="min-h-screen bg-gradient-health">
      {/* Header */}
      <div className="bg-white shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-medical bg-clip-text text-transparent">
                Doctor Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome, {doctor.name} - {doctor.specialization || 'General'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchPendingReports()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPasswordModal(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Badge className="bg-gradient-medical text-white">
                {doctor.license || doctor.licenseNumber || 'Licensed'}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Reports</p>
                  <p className="text-3xl font-bold text-medical-primary">
                    {pendingReports.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-medical-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-card-hover transition-all cursor-pointer" onClick={onNavigateToReports}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">View All Reports</p>
                  <p className="text-xl font-bold text-medical-secondary">
                    Click to view
                  </p>
                </div>
                <Eye className="w-8 h-8 text-medical-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex mb-6">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="blogs" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Blogs
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-0">
            {/* Report Reviews */}
            <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-medical-primary" />
              Medical Report Reviews
            </CardTitle>
            <CardDescription>
              Review and confirm patient medical reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-medical-primary" />
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : pendingReports.length > 0 ? (
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start justify-between p-6 border border-l-4 border-l-medical-primary rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{report.patientName}</h3>
                          <p className="text-sm text-muted-foreground">Report ID: {report.id}</p>
                        </div>
                        <Badge variant="secondary" className="bg-medical-primary text-white">
                          Awaiting Review
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground font-medium">Report Date</p>
                          <p>{new Date(report.date).toLocaleDateString()}</p>
                          <p className="text-muted-foreground font-medium mt-2">Symptoms Count</p>
                          <p>{report.symptoms?.filter(s => s.trim()).length || 0} symptoms reported</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Diagnosis Count</p>
                          <p>{report.diagnosis?.filter(d => d.trim()).length || 0} diagnoses</p>
                          <p className="text-muted-foreground font-medium mt-2">Tests Count</p>
                          <p>{report.testsconducted?.filter(t => t.trim()).length || 0} tests conducted</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-muted-foreground font-medium text-xs">Latest Symptoms:</p>
                        <p className="text-xs">{report.symptoms?.filter(s => s.trim()).slice(0, 2).join(', ') || 'None'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmReport(report.id)}
                        className="bg-health-excellent hover:bg-health-excellent/80 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectReport(report.id)}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Reports to Review</h3>
                <p className="text-muted-foreground">All medical reports have been reviewed.</p>
                <Button
                  className="mt-4 bg-gradient-medical"
                  onClick={onNavigateToReports}
                >
                  View All Reports
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Appointments Tab */}
      <TabsContent value="appointments" className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DoctorAvailabilityManager doctorId={doctor.id} />
          <DoctorAppointments doctorId={doctor.id} />
        </div>
      </TabsContent>

      {/* Blogs Tab */}
      <TabsContent value="blogs" className="mt-0">
        <DoctorBlogSection doctor={doctor} />
      </TabsContent>
    </Tabs>
      </div>

      {/* Full Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-medical-primary" />
              Full Medical Report - {selectedReport?.patientName}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedReport && (
              <div className="space-y-6">
                {/* Report Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Report ID</p>
                    <p className="font-medium">{selectedReport.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedReport.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium">{selectedReport.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{selectedReport.status}</Badge>
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <Activity className="w-4 h-4 text-medical-warning" />
                    Symptoms
                  </h4>
                  <div className="space-y-1">
                    {selectedReport.symptoms?.filter(s => s.trim()).map((symptom, i) => (
                      <div key={i} className="p-2 bg-muted rounded text-sm">{symptom}</div>
                    )) || <p className="text-muted-foreground italic">No symptoms recorded</p>}
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <Stethoscope className="w-4 h-4 text-medical-secondary" />
                    Diagnosis
                  </h4>
                  <div className="space-y-1">
                    {selectedReport.diagnosis?.filter(d => d.trim()).map((diagnosis, i) => (
                      <div key={i} className="p-2 bg-muted rounded text-sm">{diagnosis}</div>
                    )) || <p className="text-muted-foreground italic">No diagnosis recorded</p>}
                  </div>
                </div>

                {/* Tests */}
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <FileCheck className="w-4 h-4 text-health-excellent" />
                    Tests Conducted
                  </h4>
                  <div className="space-y-1">
                    {selectedReport.testsconducted?.filter(t => t.trim()).map((test, i) => (
                      <div key={i} className="p-2 bg-muted rounded text-sm">{test}</div>
                    )) || <p className="text-muted-foreground italic">No tests recorded</p>}
                  </div>
                </div>

                {/* Treatment Plan */}
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <Activity className="w-4 h-4 text-medical-accent" />
                    Treatment Plan
                  </h4>
                  <div className="space-y-1">
                    {selectedReport.treatmentPlan?.filter(t => t.trim()).map((treatment, i) => (
                      <div key={i} className="p-2 bg-muted rounded text-sm">{treatment}</div>
                    )) || <p className="text-muted-foreground italic">No treatment plan recorded</p>}
                  </div>
                </div>

                {/* Additional Notes */}
                {selectedReport.additionalNotes && (
                  <div>
                    <h4 className="font-semibold mb-2">Additional Notes</h4>
                    <div className="p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                      {selectedReport.additionalNotes}
                    </div>
                  </div>
                )}

                {/* Images */}
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-2">
                    <ImageIcon className="w-4 h-4 text-medical-accent" />
                    Report Images ({reportImages.length})
                  </h4>
                  {imagesLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-medical-primary" />
                      <p className="text-sm text-muted-foreground mt-2">Loading images...</p>
                    </div>
                  ) : reportImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {reportImages.map((img) => (
                        <div 
                          key={img.id}
                          className="relative aspect-square cursor-pointer rounded-lg overflow-hidden border hover:border-medical-primary transition-colors"
                          onClick={() => setSelectedImage(img.imageData)}
                        >
                          <img 
                            src={img.imageData} 
                            alt={img.imageName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                            {img.imageName}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">No images attached</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-health-excellent hover:bg-health-excellent/80"
                    onClick={() => handleConfirmReport(selectedReport.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Report
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleRejectReport(selectedReport.id)}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Reject Report
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Report image" 
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userId={doctor.id}
        onPasswordChanged={markPasswordChanged}
      />
    </div>
  );
};
