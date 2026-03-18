import { Booking } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Train, Calendar, Clock, MapPin, User, Ticket } from 'lucide-react';

interface TicketDisplayProps {
  booking: Booking;
}

export const TicketDisplay = ({ booking }: TicketDisplayProps) => {
  return (
    <Card className="max-w-3xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Ticket Confirmed</h2>
              <p className="text-primary-foreground/80">PNR: {booking.pnr}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-4 py-2 rounded-lg font-semibold ${
              booking.status === 'CONFIRMED' 
                ? 'bg-success text-success-foreground' 
                : 'bg-yellow-500 text-white'
            }`}>
              {booking.status}
            </div>
          </div>
        </div>
      </div>

      {/* Journey Details */}
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b">
          <Train className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-bold text-xl">
              {booking.train.trainName} ({booking.train.trainNumber})
            </h3>
            <p className="text-sm text-muted-foreground">Transaction ID: {booking.transactionId}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">From → To</p>
                <p className="font-semibold text-lg">
                  {booking.train.source} → {booking.train.destination}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Journey Date</p>
                <p className="font-semibold">{booking.journeyDate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Departure</p>
                <p className="font-semibold">{booking.train.departureTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Arrival</p>
                <p className="font-semibold">{booking.train.arrivalTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Details */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-lg">Passenger Details</h4>
          </div>
          
          <div className="space-y-3">
            {booking.passengers.map((passenger, index) => {
              const seat = booking.seatDetails[index];
              return (
                <div 
                  key={index} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{passenger.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {passenger.age} years • {passenger.gender}
                      </p>
                    </div>
                  </div>
                  
                  {seat && (
                    <div className="flex items-center gap-4 sm:pl-4">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-primary" />
                        <div className="text-sm">
                          <p className="font-semibold">
                            Coach {seat.coach} • Seat {seat.seatNumber}
                          </p>
                          <p className="text-muted-foreground">{seat.berth}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-semibold ${
                        seat.status === 'CONFIRMED' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {seat.status}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fare Details */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold">Total Fare</span>
            <span className="font-bold text-2xl text-primary">₹{booking.totalFare}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
