import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Doctor } from '@/types';

interface DoctorSelectorProps {
  selectedDoctorId?: string;
  onDoctorSelect: (doctor: Doctor) => void;
  disabled?: boolean;
}

export const DoctorSelector = ({ selectedDoctorId, onDoctorSelect, disabled }: DoctorSelectorProps) => {
  const { approvedDoctors, fetchApprovedDoctors } = useAuth();

  useEffect(() => {
    fetchApprovedDoctors();
  }, []);

  const selectedDoctor = approvedDoctors.find(d => d.id === selectedDoctorId);

  const handleSelect = (doctorId: string) => {
    const doctor = approvedDoctors.find(d => d.id === doctorId);
    if (doctor) {
      // Convert to Doctor type for compatibility
      onDoctorSelect({
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization || 'General',
        licenseNumber: doctor.licenseNumber || 'N/A',
        type: 'doctor'
      } as Doctor);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        value={selectedDoctorId || ''}
        onValueChange={handleSelect}
        disabled={disabled}
      >
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Select a doctor for review" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {approvedDoctors.length === 0 ? (
            <SelectItem value="none" disabled>No doctors available</SelectItem>
          ) : (
            approvedDoctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-medical-primary" />
                  <span>{doctor.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {doctor.specialization || 'General'}
                  </Badge>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedDoctor && (
        <Card className="bg-medical-primary/5 border-medical-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-medical-primary/10">
                <UserCheck className="w-6 h-6 text-medical-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{selectedDoctor.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {selectedDoctor.specialization || 'General'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Award className="w-4 h-4" />
                  <span>License: {selectedDoctor.licenseNumber || 'N/A'}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ID: {selectedDoctor.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
