import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, UserCheck, UserX, Users, Stethoscope, Clock, RefreshCw } from 'lucide-react';

export const AdminDashboard = () => {
  const { logout, pendingDoctors, pendingPatients, fetchPendingUsers, approveUser, rejectUser, isLoading } = useAuth();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: string, userType: 'doctor' | 'patient') => {
    setProcessingIds(prev => new Set(prev).add(userId));
    await approveUser(userId, userType);
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const handleReject = async (userId: string, userType: 'doctor' | 'patient') => {
    setProcessingIds(prev => new Set(prev).add(userId));
    await rejectUser(userId, userType);
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage user registrations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchPendingUsers()} disabled={isLoading} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={logout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Patients</CardTitle>
              <Clock className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{pendingPatients.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Doctors</CardTitle>
              <Stethoscope className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{pendingDoctors.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{pendingPatients.length + pendingDoctors.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Patients and Doctors */}
        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="patients" className="gap-2">
              <Users className="w-4 h-4" />
              Pending Patients ({pendingPatients.length})
            </TabsTrigger>
            <TabsTrigger value="doctors" className="gap-2">
              <Stethoscope className="w-4 h-4" />
              Pending Doctors ({pendingDoctors.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Patients Tab */}
          <TabsContent value="patients">
            {pendingPatients.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserCheck className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending patient registrations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingPatients.map((patient) => (
                  <Card key={patient._id} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-foreground">{patient.name}</CardTitle>
                          <CardDescription className="space-y-1 mt-2">
                            <p><span className="font-medium">Email:</span> {patient.email}</p>
                            <p><span className="font-medium">Registered:</span> {new Date(patient.registeredAt).toLocaleDateString()}</p>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(patient._id, 'patient')}
                          disabled={processingIds.has(patient._id)}
                          className="gap-2 bg-success hover:bg-success/90"
                        >
                          <UserCheck className="w-4 h-4" />
                          {processingIds.has(patient._id) ? 'Approving...' : 'Approve & Send Credentials'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(patient._id, 'patient')}
                          disabled={processingIds.has(patient._id)}
                          className="gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Doctors Tab */}
          <TabsContent value="doctors">
            {pendingDoctors.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Stethoscope className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending doctor registrations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingDoctors.map((doctor) => (
                  <Card key={doctor._id} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-foreground">{doctor.name}</CardTitle>
                          <CardDescription className="space-y-1 mt-2">
                            <p><span className="font-medium">Email:</span> {doctor.email}</p>
                            <p><span className="font-medium">Specialization:</span> {doctor.specialization || 'N/A'}</p>
                            <p><span className="font-medium">License:</span> {doctor.licenseNumber || 'N/A'}</p>
                            <p><span className="font-medium">Registered:</span> {new Date(doctor.registeredAt).toLocaleDateString()}</p>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(doctor._id, 'doctor')}
                          disabled={processingIds.has(doctor._id)}
                          className="gap-2 bg-success hover:bg-success/90"
                        >
                          <UserCheck className="w-4 h-4" />
                          {processingIds.has(doctor._id) ? 'Approving...' : 'Approve & Send Credentials'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(doctor._id, 'doctor')}
                          disabled={processingIds.has(doctor._id)}
                          className="gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
