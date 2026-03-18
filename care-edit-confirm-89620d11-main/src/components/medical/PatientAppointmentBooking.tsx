import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  User,
  Stethoscope,
  RefreshCw,
  Check
} from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import type { Doctor, DoctorAvailability, TimeSlot, Patient } from '@/types';
import { format, addDays } from 'date-fns';

interface PatientAppointmentBookingProps {
  approvedDoctors: Doctor[];
}

export const PatientAppointmentBooking = ({ approvedDoctors }: PatientAppointmentBookingProps) => {
  const { currentUser } = useAuth();
  const { getAvailability, doctorAvailability, createAppointment, isLoading } = useAppointments();
  
  const patient = currentUser as Patient;
  
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [appointmentMode, setAppointmentMode] = useState<'online' | 'offline'>('online');
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentAvailability, setCurrentAvailability] = useState<DoctorAvailability | null>(null);

  useEffect(() => {
    if (selectedDoctor) {
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      getAvailability(selectedDoctor.id, startDate, endDate);
      setSelectedDate(undefined);
      setSelectedSlot(null);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const availability = doctorAvailability.find(a => a.date === dateStr);
      setCurrentAvailability(availability || null);
      setSelectedSlot(null);
      
      // Reset mode based on availability
      if (availability) {
        if (availability.isOnlineAvailable && !availability.isOfflineAvailable) {
          setAppointmentMode('online');
        } else if (!availability.isOnlineAvailable && availability.isOfflineAvailable) {
          setAppointmentMode('offline');
        }
      }
    }
  }, [selectedDate, doctorAvailability]);

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    
    const appointment = await createAppointment({
      patientId: patient.id,
      patientName: patient.name,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialization: selectedDoctor.specialization || 'General',
      date: format(selectedDate, 'yyyy-MM-dd'),
      timeSlot: selectedSlot,
      mode: appointmentMode,
      notes: notes.trim() || undefined
    });
    
    if (appointment) {
      setShowConfirmDialog(false);
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setNotes('');
    }
  };

  const availableDates = doctorAvailability.map(a => new Date(a.date));

  return (
    <Card className="shadow-lg border-0 bg-card">
      <CardHeader className="bg-gradient-to-r from-medical-primary/10 to-medical-secondary/10 rounded-t-lg border-b">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-medical-primary/20 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-medical-primary" />
          </div>
          Book an Appointment
        </CardTitle>
        <CardDescription className="text-base">
          Schedule a consultation with one of our doctors
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Progress Steps Indicator */}
          <div className="flex items-center justify-between px-4">
            {[
              { num: 1, label: 'Doctor', active: true },
              { num: 2, label: 'Date', active: !!selectedDoctor },
              { num: 3, label: 'Time', active: !!selectedDate },
              { num: 4, label: 'Confirm', active: !!selectedSlot }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className={`flex flex-col items-center ${step.active ? 'text-medical-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                    step.active 
                      ? 'bg-medical-primary text-white border-medical-primary shadow-md' 
                      : 'bg-muted border-muted-foreground/30'
                  }`}>
                    {step.num}
                  </div>
                  <span className="text-xs mt-1 font-medium">{step.label}</span>
                </div>
                {idx < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${step.active && [selectedDoctor, selectedDate, selectedSlot][idx] ? 'bg-medical-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Doctor */}
          <div className="bg-muted/30 rounded-xl p-5 border">
            <Label className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-medical-primary text-white flex items-center justify-center text-sm">1</span>
              Select a Doctor
            </Label>
            <ScrollArea className="h-[220px] pr-4 mt-4">
              <div className="grid gap-3">
                {approvedDoctors.length > 0 ? approvedDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all bg-card hover:shadow-md ${
                      selectedDoctor?.id === doctor.id 
                        ? 'border-medical-primary bg-medical-primary/5 shadow-md ring-2 ring-medical-primary/30' 
                        : 'border-border hover:border-medical-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-medical-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-medical-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{doctor.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-xs">
                              <Stethoscope className="w-3 h-3 mr-1" />
                              {doctor.specialization || 'General Medicine'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {doctor.experience} yrs exp
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedDoctor?.id === doctor.id && (
                        <div className="w-8 h-8 rounded-full bg-medical-primary flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No doctors available at the moment</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Step 2: Select Date */}
          {selectedDoctor && (
            <div className="bg-muted/30 rounded-xl p-5 border animate-in slide-in-from-bottom-4 duration-300">
              <Label className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-medical-primary text-white flex items-center justify-center text-sm">2</span>
                Choose a Date
              </Label>
              <div className="flex flex-col items-center mt-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isAvailable = doctorAvailability.some(a => a.date === dateStr);
                    return date < new Date() || !isAvailable;
                  }}
                  modifiers={{
                    available: availableDates
                  }}
                  modifiersStyles={{
                    available: { 
                      backgroundColor: 'hsl(var(--medical-primary) / 0.15)',
                      borderRadius: '50%',
                      fontWeight: 600
                    }
                  }}
                  className="rounded-xl border bg-card p-3"
                />
                {isLoading && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading availability...
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-medical-primary/20 mr-1"></span>
                  Highlighted dates are available
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Select Time & Mode */}
          {selectedDate && currentAvailability && (
            <div className="bg-muted/30 rounded-xl p-5 border space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              {/* Time Slots */}
              <div>
                <Label className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-medical-primary text-white flex items-center justify-center text-sm">3</span>
                  Select Time Slot
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {currentAvailability.timeSlots.map((slot) => (
                    <Button
                      key={`${slot.start}-${slot.end}`}
                      variant={selectedSlot?.start === slot.start ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setSelectedSlot(slot)}
                      className={`h-14 flex flex-col gap-0.5 ${
                        selectedSlot?.start === slot.start 
                          ? 'bg-medical-primary hover:bg-medical-primary/90 shadow-md' 
                          : 'hover:border-medical-primary hover:bg-medical-primary/5'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">{slot.start}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Consultation Mode */}
              <div>
                <Label className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-medical-primary text-white flex items-center justify-center text-sm">4</span>
                  Consultation Mode
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {currentAvailability.isOnlineAvailable && (
                    <div
                      onClick={() => setAppointmentMode('online')}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        appointmentMode === 'online' 
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                          : 'border-border hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          appointmentMode === 'online' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'
                        }`}>
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Online</p>
                          <p className="text-xs text-muted-foreground">Video consultation</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {currentAvailability.isOfflineAvailable && (
                    <div
                      onClick={() => setAppointmentMode('offline')}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        appointmentMode === 'offline' 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' 
                          : 'border-border hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          appointmentMode === 'offline' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                        }`}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">In-Person</p>
                          <p className="text-xs text-muted-foreground">Visit the clinic</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-base font-medium mb-2 block">Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Describe your symptoms or reason for the visit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Book Button */}
              <Button 
                onClick={() => setShowConfirmDialog(true)} 
                disabled={!selectedSlot}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-medical-primary hover:bg-medical-primary/90 shadow-lg"
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Book Appointment
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedDoctor?.name}</span>
                <Badge variant="secondary">{selectedDoctor?.specialization}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedSlot?.start} - {selectedSlot?.end}
                </span>
              </div>
              <Badge variant="outline" className={appointmentMode === 'online' ? 'text-green-600' : 'text-orange-600'}>
                {appointmentMode === 'online' ? (
                  <><Video className="w-3 h-3 mr-1" /> Online Consultation</>
                ) : (
                  <><MapPin className="w-3 h-3 mr-1" /> In-Person Visit</>
                )}
              </Badge>
            </div>
            {notes && (
              <div>
                <Label className="text-sm text-muted-foreground">Your Notes:</Label>
                <p className="text-sm mt-1">{notes}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment} 
              disabled={isLoading}
              className="bg-medical-primary hover:bg-medical-primary/90"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
