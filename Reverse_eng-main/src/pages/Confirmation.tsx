import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TicketDisplay } from '@/components/TicketDisplay';
import { Booking } from '@/types/booking';
import { isAuthenticated } from '@/utils/auth';
import { Download, Home } from 'lucide-react';

const Confirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    const bookings: Booking[] = JSON.parse(localStorage.getItem('user_bookings') || '[]');
    const found = bookings.find(b => b.id === bookingId);
    
    if (!found) {
      navigate('/search');
      return;
    }

    setBooking(found);
  }, [bookingId, navigate]);

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">
              Your ticket has been successfully booked
            </p>
          </div>

          <TicketDisplay booking={booking} />

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Ticket
            </Button>
            <Button onClick={() => navigate('/search')}>
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
