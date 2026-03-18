import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Booking } from '@/types/booking';
import { getCurrentUser, isAuthenticated, logout } from '@/utils/auth';
import { ArrowLeft, Ticket, Calendar, MapPin, LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    const allBookings: Booking[] = JSON.parse(localStorage.getItem('user_bookings') || '[]');
    const userBookings = allBookings.filter(b => b.userId === user?.id);
    setBookings(userBookings.reverse()); // Most recent first
  }, [navigate, user]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/search')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
            <p className="text-muted-foreground">Welcome back, {user?.username}!</p>
          </div>

          {bookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your journey by booking your first train ticket
              </p>
              <Button onClick={() => navigate('/search')}>
                Search Trains
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/confirmation/${booking.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-bold text-sm">
                          {booking.train.trainNumber}
                        </div>
                        <h3 className="text-lg font-semibold">{booking.train.trainName}</h3>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.train.source} → {booking.train.destination}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{booking.journeyDate}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground">PNR: {booking.pnr}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.passengers.length} Passenger{booking.passengers.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className={`px-4 py-2 rounded-lg font-semibold ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-success/10 text-success'
                          : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {booking.status}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{booking.totalFare}</p>
                        <p className="text-xs text-muted-foreground">Total Fare</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
