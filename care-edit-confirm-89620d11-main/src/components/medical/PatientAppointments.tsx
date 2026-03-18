import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  Stethoscope,
  RefreshCw,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import type { Appointment, AppointmentStatus } from '@/types';
import { format } from 'date-fns';

interface PatientAppointmentsProps {
  patientId: string;
}

const statusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  live: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Awaiting Confirmation',
  approved: 'Confirmed',
  live: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const PatientAppointments = ({ patientId }: PatientAppointmentsProps) => {
  const { appointments, getPatientAppointments, cancelAppointment, isLoading } = useAppointments();

  useEffect(() => {
    getPatientAppointments(patientId);
  }, [patientId]);

  const handleCancel = async (appointmentId: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      await cancelAppointment(appointmentId);
      getPatientAppointments(patientId);
    }
  };

  const upcomingAppointments = appointments.filter(a => 
    ['pending', 'approved', 'live'].includes(a.status)
  );
  const pastAppointments = appointments.filter(a => 
    ['completed', 'cancelled'].includes(a.status)
  );

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <div className="p-5 border-2 rounded-xl bg-card hover:shadow-lg transition-all">
      {/* Header with Doctor Info and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-medical-primary/20 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-medical-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg text-foreground">{appointment.doctorName}</p>
            <p className="text-sm text-muted-foreground">{appointment.doctorSpecialization}</p>
          </div>
        </div>
        <Badge className={`${statusColors[appointment.status]} px-3 py-1.5 text-sm font-medium`}>
          {statusLabels[appointment.status]}
        </Badge>
      </div>

      {/* Appointment Details */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-medical-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium text-sm">{format(new Date(appointment.date), 'MMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-medical-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="font-medium text-sm">{appointment.timeSlot.start} - {appointment.timeSlot.end}</p>
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-border/50">
          {appointment.mode === 'online' ? (
            <div className="flex items-center gap-2 text-green-600">
              <Video className="w-4 h-4" />
              <span className="font-medium text-sm">Online Consultation</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600">
              <MapPin className="w-4 h-4" />
              <span className="font-medium text-sm">In-Person Visit</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {appointment.notes && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Your Note:</p>
          <p className="text-sm text-foreground">{appointment.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {appointment.status === 'live' && appointment.mode === 'online' && appointment.zoomUrl && (
          <Button 
            size="lg"
            onClick={() => window.open(appointment.zoomUrl, '_blank')}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
          >
            <Video className="w-5 h-5 mr-2" /> 
            Join Meeting Now
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}
        
        {['pending', 'approved'].includes(appointment.status) && (
          <Button 
            size="sm" 
            variant="outline" 
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleCancel(appointment.id)}
          >
            <XCircle className="w-4 h-4 mr-1" /> Cancel Appointment
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg border-0 bg-card">
      <CardHeader className="bg-gradient-to-r from-medical-primary/10 to-medical-secondary/10 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-medical-primary/20 rounded-lg">
              <Calendar className="w-5 h-5 text-medical-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">My Appointments</CardTitle>
              <CardDescription className="text-base">View and manage your scheduled appointments</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => getPatientAppointments(patientId)} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Upcoming Appointments */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-medical-primary animate-pulse"></div>
              <h4 className="font-semibold text-lg">Upcoming Appointments</h4>
              {upcomingAppointments.length > 0 && (
                <Badge className="bg-medical-primary/20 text-medical-primary">{upcomingAppointments.length}</Badge>
              )}
            </div>
            {upcomingAppointments.length > 0 ? (
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-4">
                  {upcomingAppointments.map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/30">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No upcoming appointments</p>
                <p className="text-sm mt-1">Book an appointment with a doctor to get started</p>
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                <h4 className="font-semibold text-lg text-muted-foreground">Past Appointments</h4>
                <Badge variant="secondary">{pastAppointments.length}</Badge>
              </div>
              <ScrollArea className="h-[220px] pr-4">
                <div className="space-y-4 opacity-80">
                  {pastAppointments.map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
