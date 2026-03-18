import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  Play,
  Link as LinkIcon,
  RefreshCw,
  User
} from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import type { Appointment, AppointmentStatus } from '@/types';
import { format } from 'date-fns';

interface DoctorAppointmentsProps {
  doctorId: string;
}

const statusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  live: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const DoctorAppointments = ({ doctorId }: DoctorAppointmentsProps) => {
  const { appointments, getDoctorAppointments, updateAppointmentStatus, setZoomUrl, isLoading } = useAppointments();
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [zoomUrlInput, setZoomUrlInput] = useState('');
  const [showZoomDialog, setShowZoomDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'approve' | 'start'>('approve');

  useEffect(() => {
    getDoctorAppointments(doctorId);
  }, [doctorId]);

  const handleApproveClick = (appointment: Appointment) => {
    // For online appointments, require Zoom URL before approval
    if (appointment.mode === 'online') {
      setSelectedAppointment(appointment);
      setZoomUrlInput('');
      setDialogMode('approve');
      setShowZoomDialog(true);
    } else {
      // For in-person appointments, approve directly
      handleApproveDirectly(appointment.id);
    }
  };

  const handleApproveDirectly = async (appointmentId: string) => {
    await updateAppointmentStatus(appointmentId, 'approved');
    getDoctorAppointments(doctorId);
  };

  const handleApproveWithZoom = async () => {
    if (selectedAppointment && zoomUrlInput.trim()) {
      await setZoomUrl(selectedAppointment.id, zoomUrlInput.trim());
      await updateAppointmentStatus(selectedAppointment.id, 'approved', zoomUrlInput.trim());
      setShowZoomDialog(false);
      getDoctorAppointments(doctorId);
    }
  };

  const handleReject = async (appointmentId: string) => {
    await updateAppointmentStatus(appointmentId, 'cancelled');
    getDoctorAppointments(doctorId);
  };

  const handleStartConsultation = (appointment: Appointment) => {
    if (appointment.zoomUrl) {
      window.open(appointment.zoomUrl, '_blank');
      updateAppointmentStatus(appointment.id, 'live');
    } else {
      setSelectedAppointment(appointment);
      setZoomUrlInput('');
      setDialogMode('start');
      setShowZoomDialog(true);
    }
  };

  const handleSaveZoomUrl = async () => {
    if (selectedAppointment && zoomUrlInput.trim()) {
      await setZoomUrl(selectedAppointment.id, zoomUrlInput.trim());
      await updateAppointmentStatus(selectedAppointment.id, 'live', zoomUrlInput.trim());
      setShowZoomDialog(false);
      window.open(zoomUrlInput.trim(), '_blank');
      getDoctorAppointments(doctorId);
    }
  };

  const handleComplete = async (appointmentId: string) => {
    await updateAppointmentStatus(appointmentId, 'completed');
    getDoctorAppointments(doctorId);
  };

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const upcomingAppointments = appointments.filter(a => ['approved', 'live'].includes(a.status));
  const pastAppointments = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{appointment.patientName}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(appointment.date), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {appointment.timeSlot.start} - {appointment.timeSlot.end}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={appointment.mode === 'online' ? 'text-green-600' : 'text-orange-600'}>
            {appointment.mode === 'online' ? (
              <><Video className="w-3 h-3 mr-1" /> Online</>
            ) : (
              <><MapPin className="w-3 h-3 mr-1" /> In-Person</>
            )}
          </Badge>
          <Badge className={statusColors[appointment.status]}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Badge>
        </div>
      </div>

      {appointment.notes && (
        <p className="text-sm text-muted-foreground mb-3 bg-muted p-2 rounded">
          Note: {appointment.notes}
        </p>
      )}

      {appointment.zoomUrl && (
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
          <LinkIcon className="w-3 h-3" />
          <a href={appointment.zoomUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
            {appointment.zoomUrl}
          </a>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {appointment.status === 'pending' && (
          <>
            <Button size="sm" onClick={() => handleApproveClick(appointment)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleReject(appointment.id)}>
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
          </>
        )}
        
        {appointment.status === 'approved' && appointment.mode === 'online' && (
          <Button size="sm" onClick={() => handleStartConsultation(appointment)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Play className="w-4 h-4 mr-1" /> Start Consultation
          </Button>
        )}

        {appointment.status === 'live' && (
          <>
            {appointment.mode === 'online' && appointment.zoomUrl && (
              <Button size="sm" variant="outline" onClick={() => window.open(appointment.zoomUrl, '_blank')}>
                <Video className="w-4 h-4 mr-1" /> Join Meeting
              </Button>
            )}
            <Button size="sm" onClick={() => handleComplete(appointment.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="w-4 h-4 mr-1" /> Mark Complete
            </Button>
          </>
        )}

        {appointment.status === 'approved' && appointment.mode === 'offline' && (
          <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, 'live')} className="bg-orange-600 hover:bg-orange-700 text-white">
            <Play className="w-4 h-4 mr-1" /> Start In-Person
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-medical-primary" />
                Appointments
              </CardTitle>
              <CardDescription>Manage your patient appointments</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => getDoctorAppointments(doctorId)} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingAppointments.length > 0 && (
                  <Badge className="ml-2 bg-yellow-500 text-white text-xs px-1.5">
                    {pendingAppointments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">History</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ScrollArea className="h-[400px] pr-4">
                {pendingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {pendingAppointments.map(apt => (
                      <AppointmentCard key={apt.id} appointment={apt} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending appointment requests
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="upcoming">
              <ScrollArea className="h-[400px] pr-4">
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.map(apt => (
                      <AppointmentCard key={apt.id} appointment={apt} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming appointments
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="past">
              <ScrollArea className="h-[400px] pr-4">
                {pastAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {pastAppointments.map(apt => (
                      <AppointmentCard key={apt.id} appointment={apt} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointment history
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Zoom URL Dialog */}
      <Dialog open={showZoomDialog} onOpenChange={setShowZoomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              {dialogMode === 'approve' ? 'Enter Zoom Meeting URL to Approve' : 'Enter Zoom Meeting URL'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {dialogMode === 'approve' 
                ? `Create a Zoom meeting for the scheduled time and paste the link below to approve the appointment with ${selectedAppointment?.patientName}.`
                : `Create a Zoom meeting and paste the meeting link below to start the consultation with ${selectedAppointment?.patientName}.`
              }
            </p>
            <div className="space-y-2">
              <Label htmlFor="zoom-url" className="text-sm font-medium">
                Zoom Meeting URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="zoom-url"
                placeholder="https://zoom.us/j/1234567890"
                value={zoomUrlInput}
                onChange={(e) => setZoomUrlInput(e.target.value)}
              />
            </div>
            {selectedAppointment && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(selectedAppointment.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{selectedAppointment.timeSlot.start} - {selectedAppointment.timeSlot.end}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZoomDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={dialogMode === 'approve' ? handleApproveWithZoom : handleSaveZoomUrl} 
              disabled={!zoomUrlInput.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {dialogMode === 'approve' ? (
                <><CheckCircle className="w-4 h-4 mr-2" /> Approve & Save</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Save & Start</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
