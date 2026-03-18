import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarDays, 
  Clock, 
  Trash2, 
  Video, 
  MapPin,
  RefreshCw,
  Save,
  Check,
  Lock,
  Circle
} from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import type { TimeSlot } from '@/types';
import { format, addDays } from 'date-fns';

interface DoctorAvailabilityManagerProps {
  doctorId: string;
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start: '09:00', end: '09:30' },
  { start: '09:30', end: '10:00' },
  { start: '10:00', end: '10:30' },
  { start: '10:30', end: '11:00' },
  { start: '11:00', end: '11:30' },
  { start: '11:30', end: '12:00' },
  { start: '14:00', end: '14:30' },
  { start: '14:30', end: '15:00' },
  { start: '15:00', end: '15:30' },
  { start: '15:30', end: '16:00' },
  { start: '16:00', end: '16:30' },
  { start: '16:30', end: '17:00' },
];

export const DoctorAvailabilityManager = ({ doctorId }: DoctorAvailabilityManagerProps) => {
  const { doctorAvailability, appointments, setAvailability, getAvailability, deleteAvailability, getDoctorAppointments, isLoading } = useAppointments();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [isOnlineAvailable, setIsOnlineAvailable] = useState(true);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(true);

  useEffect(() => {
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
    getAvailability(doctorId, startDate, endDate);
    getDoctorAppointments(doctorId);
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existing = doctorAvailability.find(a => a.date === dateStr);
      if (existing) {
        setSelectedSlots(existing.timeSlots);
        setIsOnlineAvailable(existing.isOnlineAvailable);
        setIsOfflineAvailable(existing.isOfflineAvailable);
      } else {
        setSelectedSlots([]);
        setIsOnlineAvailable(true);
        setIsOfflineAvailable(true);
      }
    }
  }, [selectedDate, doctorAvailability]);

  const hasConfirmedAppointments = selectedDate 
    ? appointments.some(apt => 
        apt.date === format(selectedDate, 'yyyy-MM-dd') && 
        ['approved', 'live', 'completed'].includes(apt.status)
      )
    : false;

  const bookedSlots = selectedDate 
    ? appointments
        .filter(apt => 
          apt.date === format(selectedDate, 'yyyy-MM-dd') && 
          ['approved', 'live', 'pending'].includes(apt.status)
        )
        .map(apt => apt.timeSlot)
    : [];

  const isSlotBooked = (slot: TimeSlot) => {
    return bookedSlots.some(s => s.start === slot.start && s.end === slot.end);
  };

  const toggleSlot = (slot: TimeSlot) => {
    if (isSlotBooked(slot)) return;
    
    const exists = selectedSlots.some(s => s.start === slot.start && s.end === slot.end);
    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => !(s.start === slot.start && s.end === slot.end)));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || hasConfirmedAppointments) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await setAvailability(doctorId, dateStr, selectedSlots, isOnlineAvailable, isOfflineAvailable);
  };

  const handleDelete = async () => {
    if (!selectedDate || hasConfirmedAppointments) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await deleteAvailability(doctorId, dateStr);
    setSelectedSlots([]);
  };

  const selectAllSlots = () => {
    const unbookedSlots = DEFAULT_TIME_SLOTS.filter(slot => !isSlotBooked(slot));
    setSelectedSlots([...unbookedSlots, ...bookedSlots.filter(bs => selectedSlots.some(s => s.start === bs.start))]);
  };
  
  const clearAllSlots = () => {
    setSelectedSlots(selectedSlots.filter(slot => isSlotBooked(slot)));
  };

  const availableDates = doctorAvailability.map(a => new Date(a.date));

  return (
    <Card className="shadow-sm border bg-card overflow-hidden">
      <CardHeader className="bg-muted/30 border-b px-6 py-5">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <CalendarDays className="w-5 h-5 text-primary" />
          Manage Availability
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* LEFT: Calendar */}
          <div className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              modifiers={{
                available: availableDates
              }}
              modifiersStyles={{
                available: { 
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  fontWeight: '600'
                }
              }}
              className="rounded-lg"
            />
            
            <Separator className="my-4" />
            
            {/* Legend */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Legend</p>
              <div className="flex items-center gap-2 text-sm">
                <Circle className="w-3 h-3 fill-primary/20 text-primary" />
                <span className="text-muted-foreground">Availability set</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span className="text-muted-foreground">Selected date</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Settings Panel */}
          <div className="p-6">
            {selectedDate ? (
              <div className="space-y-6">
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Date</p>
                    <h3 className="text-xl font-semibold text-foreground">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </h3>
                  </div>
                  
                  {hasConfirmedAppointments && (
                    <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 gap-1.5">
                      <Lock className="w-3 h-3" />
                      Appointments Confirmed
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Appointment Modes */}
                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">Consultation Modes</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Online Card */}
                    <button
                      type="button"
                      onClick={() => !hasConfirmedAppointments && setIsOnlineAvailable(!isOnlineAvailable)}
                      disabled={hasConfirmedAppointments}
                      className={`relative flex flex-col items-start p-5 rounded-xl border-2 transition-all text-left ${
                        isOnlineAvailable 
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40' 
                          : 'border-border bg-muted/30 hover:border-muted-foreground/40'
                      } ${hasConfirmedAppointments ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`p-3 rounded-xl mb-3 ${
                        isOnlineAvailable 
                          ? 'bg-emerald-500/20 dark:bg-emerald-500/30' 
                          : 'bg-muted'
                      }`}>
                        <Video className={`w-5 h-5 ${
                          isOnlineAvailable 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-muted-foreground'
                        }`} />
                      </div>
                      <p className={`font-semibold text-base ${
                        isOnlineAvailable 
                          ? 'text-emerald-700 dark:text-emerald-300' 
                          : 'text-muted-foreground'
                      }`}>
                        Online
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Video consultation</p>
                      
                      {/* Toggle indicator */}
                      <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isOnlineAvailable 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : 'border-muted-foreground/40 bg-transparent'
                      }`}>
                        {isOnlineAvailable && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>

                    {/* In-Person Card */}
                    <button
                      type="button"
                      onClick={() => !hasConfirmedAppointments && setIsOfflineAvailable(!isOfflineAvailable)}
                      disabled={hasConfirmedAppointments}
                      className={`relative flex flex-col items-start p-5 rounded-xl border-2 transition-all text-left ${
                        isOfflineAvailable 
                          ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40' 
                          : 'border-border bg-muted/30 hover:border-muted-foreground/40'
                      } ${hasConfirmedAppointments ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`p-3 rounded-xl mb-3 ${
                        isOfflineAvailable 
                          ? 'bg-orange-500/20 dark:bg-orange-500/30' 
                          : 'bg-muted'
                      }`}>
                        <MapPin className={`w-5 h-5 ${
                          isOfflineAvailable 
                            ? 'text-orange-600 dark:text-orange-400' 
                            : 'text-muted-foreground'
                        }`} />
                      </div>
                      <p className={`font-semibold text-base ${
                        isOfflineAvailable 
                          ? 'text-orange-700 dark:text-orange-300' 
                          : 'text-muted-foreground'
                      }`}>
                        In-Person
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Clinic visit</p>
                      
                      {/* Toggle indicator */}
                      <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isOfflineAvailable 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'border-muted-foreground/40 bg-transparent'
                      }`}>
                        {isOfflineAvailable && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Time Slots */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">Time Slots</p>
                      {selectedSlots.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedSlots.length} selected
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={selectAllSlots}
                        disabled={hasConfirmedAppointments}
                        className="text-xs h-7"
                      >
                        Select all
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllSlots}
                        disabled={hasConfirmedAppointments}
                        className="text-xs h-7"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-4 gap-2">
                      {DEFAULT_TIME_SLOTS.map((slot) => {
                        const isSelected = selectedSlots.some(
                          s => s.start === slot.start && s.end === slot.end
                        );
                        const isBooked = isSlotBooked(slot);
                        
                        return (
                          <button
                            key={`${slot.start}-${slot.end}`}
                            onClick={() => toggleSlot(slot)}
                            disabled={isBooked}
                            className={`relative flex items-center justify-center h-10 rounded-md text-sm font-medium transition-all ${
                              isBooked 
                                ? 'bg-amber-100 text-amber-700 border border-amber-300 cursor-not-allowed dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
                                : isSelected 
                                  ? 'bg-primary text-primary-foreground shadow-sm' 
                                  : 'bg-muted/50 text-foreground border border-border hover:bg-muted hover:border-primary/50'
                            }`}
                          >
                            {slot.start}
                            {isBooked && <Lock className="w-3 h-3 ml-1" />}
                            {isSelected && !isBooked && <Check className="w-3 h-3 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  {bookedSlots.length > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Some slots are locked due to existing appointments
                    </p>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading || selectedSlots.length === 0 || hasConfirmedAppointments}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : hasConfirmedAppointments ? (
                      <Lock className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {hasConfirmedAppointments ? 'Locked' : 'Save Availability'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isLoading || hasConfirmedAppointments}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <CalendarDays className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No Date Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a date from the calendar to manage availability
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
