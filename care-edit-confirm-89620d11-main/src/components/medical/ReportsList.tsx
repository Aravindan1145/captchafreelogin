import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Search,
  Calendar,
  User,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import type { MedicalReport } from '@/types';

interface ReportsListProps {
  onBack: () => void;
  onEditReport: (reportId: string) => void;
  onCreateReport: () => void;
}

export const ReportsList = ({ onBack, onEditReport, onCreateReport }: ReportsListProps) => {
  const { currentUser } = useAuth();
  const { reports, getPatientReports, getDoctorReports } = useReports();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const isPatient = currentUser?.type === 'patient';
  const isDoctor = currentUser?.type === 'doctor';
  
  // Get reports based on user type
  const userReports = isPatient 
    ? getPatientReports(currentUser.id)
    : isDoctor 
      ? getDoctorReports(currentUser.id)
      : reports;

  // Filter reports based on search and status
  const filteredReports = userReports.filter(report => {
    const matchesSearch = 
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.doctorName && report.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: MedicalReport['status']) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'submitted':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: MedicalReport['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-health-excellent text-white';
      case 'submitted':
        return 'bg-medical-primary text-white';
      case 'rejected':
        return 'bg-medical-error text-white';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-health">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-medical bg-clip-text text-transparent">
                Medical Reports
              </h1>
              <p className="text-muted-foreground">
                {isPatient ? 'Manage your medical reports' : 'Review patient reports'}
              </p>
            </div>
          </div>
          {isPatient && (
            <Button
              onClick={onCreateReport}
              className="bg-gradient-medical"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="shadow-card mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by patient name, report ID, or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-gradient-medical' : ''}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('draft')}
                  className={statusFilter === 'draft' ? 'bg-gradient-medical' : ''}
                >
                  Draft
                </Button>
                <Button
                  variant={statusFilter === 'submitted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('submitted')}
                  className={statusFilter === 'submitted' ? 'bg-gradient-medical' : ''}
                >
                  Submitted
                </Button>
                <Button
                  variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('confirmed')}
                  className={statusFilter === 'confirmed' ? 'bg-gradient-medical' : ''}
                >
                  Confirmed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="shadow-card hover:shadow-card-hover transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold">{report.patientName}</h3>
                          <Badge 
                            variant={getStatusBadgeVariant(report.status)}
                            className={getStatusColor(report.status)}
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {report.id}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Stethoscope className="w-4 h-4 mr-2" />
                          {report.doctorName || 'No doctor assigned'}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="w-4 h-4 mr-2" />
                          {report.symptoms.length} symptoms reported
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Latest Symptoms:</p>
                          <p className="text-xs">
                            {report.symptoms.slice(0, 2).join(', ')}
                            {report.symptoms.length > 2 && '...'}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Diagnosis Count:</p>
                          <p className="text-xs">
                            {report.diagnosis.length} diagnoses • {report.testsconducted.length} tests
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditReport(report.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {report.isEditable && (isPatient && report.patientId === currentUser?.id || isDoctor) && (
                        <Button
                          size="sm"
                          onClick={() => onEditReport(report.id)}
                          className="bg-gradient-medical"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-card">
            <CardContent className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No reports match your criteria' : 'No medical reports'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter settings'
                  : isPatient 
                    ? 'Create your first medical report to get started'
                    : 'No reports available for review'
                }
              </p>
              {isPatient && !searchTerm && statusFilter === 'all' && (
                <Button
                  onClick={onCreateReport}
                  className="bg-gradient-medical"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Report
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};