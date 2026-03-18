import { Train } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, IndianRupee, Users } from 'lucide-react';

interface TrainCardProps {
  train: Train;
  onBook: (train: Train) => void;
}

export const TrainCard = ({ train, onBook }: TrainCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-bold">
              {train.trainNumber}
            </div>
            <h3 className="text-xl font-semibold">{train.trainName}</h3>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{train.source} → {train.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{train.duration}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Departure</p>
              <p className="font-semibold text-lg">{train.departureTime}</p>
              <p className="text-xs text-muted-foreground">{train.source}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Arrival</p>
              <p className="font-semibold text-lg">{train.arrivalTime}</p>
              <p className="text-xs text-muted-foreground">{train.destination}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 md:min-w-[200px]">
          <div className="text-right">
            <div className="flex items-center gap-1 text-3xl font-bold text-primary">
              <IndianRupee className="w-6 h-6" />
              {train.fare}
            </div>
            <p className="text-xs text-muted-foreground">per passenger</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-success" />
            <span className="text-success font-medium">{train.availableSeats} seats available</span>
          </div>

          <Button 
            onClick={() => onBook(train)}
            className="w-full"
            size="lg"
          >
            Book Now
          </Button>
        </div>
      </div>
    </Card>
  );
};
