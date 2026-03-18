import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Booking } from '@/types/booking';
import { generatePNR, generateSeatDetails } from '@/utils/mockData';
import { getCurrentUser, isAuthenticated } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    const pending = localStorage.getItem('pending_booking');
    if (!pending) {
      navigate('/search');
      return;
    }

    setBookingData(JSON.parse(pending));
  }, [navigate]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate card details (basic validation for demo)
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      toast({
        title: 'Invalid Card',
        description: 'Card number must be 16 digits',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (cvv.length !== 3) {
      toast({
        title: 'Invalid CVV',
        description: 'CVV must be 3 digits',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const user = getCurrentUser();
      if (!user) throw new Error('User not found');

      const pnr = generatePNR();
      const transactionId = `TXN${Date.now()}`;
      const seatDetails = generateSeatDetails(bookingData.passengers.length);

      const booking: Booking = {
        id: Date.now().toString(),
        userId: user.id,
        pnr,
        train: bookingData.train,
        passengers: bookingData.passengers.map((p: any, i: number) => ({
          ...p,
          seatNumber: seatDetails[i].seatNumber,
          coach: seatDetails[i].coach,
          berth: seatDetails[i].berth
        })),
        totalFare: bookingData.totalFare,
        bookingDate: new Date().toISOString(),
        journeyDate: bookingData.train.date,
        status: 'CONFIRMED',
        seatDetails: bookingData.passengers.map((p: any, i: number) => ({
          passengerName: p.name,
          coach: seatDetails[i].coach,
          seatNumber: seatDetails[i].seatNumber,
          berth: seatDetails[i].berth,
          status: 'CONFIRMED'
        })),
        transactionId
      };

      // Save booking
      const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
      bookings.push(booking);
      localStorage.setItem('user_bookings', JSON.stringify(bookings));
      
      // Clear pending booking
      localStorage.removeItem('pending_booking');
      localStorage.removeItem('selected_train');

      toast({
        title: 'Payment Successful',
        description: 'Your ticket has been confirmed!',
      });

      navigate(`/confirmation/${booking.id}`);
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/booking')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Complete Payment</h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment Form */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Card Details</h2>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      if (value.length <= 16 && /^\d*$/.test(value)) {
                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                        setCardNumber(formatted);
                      }
                    }}
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      value={expiryDate}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          const formatted = value.length >= 3 
                            ? `${value.slice(0, 2)}/${value.slice(2)}` 
                            : value;
                          setExpiryDate(formatted);
                        }
                      }}
                      placeholder="MM/YY"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      value={cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 3) {
                          setCvv(value);
                        }
                      }}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Lock className="w-4 h-4" />
                  <span>Your payment information is secure</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Processing Payment...' : `Pay ₹${bookingData.totalFare}`}
                </Button>
              </form>
            </Card>

            {/* Booking Summary */}
            <Card className="p-6 h-fit">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
              
              <div className="space-y-4">
                <div className="pb-4 border-b">
                  <p className="font-semibold">{bookingData.train.trainName}</p>
                  <p className="text-sm text-muted-foreground">
                    {bookingData.train.trainNumber}
                  </p>
                  <p className="text-sm mt-2">
                    {bookingData.train.source} → {bookingData.train.destination}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bookingData.train.date}
                  </p>
                </div>

                <div className="pb-4 border-b">
                  <p className="font-semibold mb-2">Passengers</p>
                  {bookingData.passengers.map((p: any, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {i + 1}. {p.name || 'Passenger ' + (i + 1)} ({p.age} yrs, {p.gender})
                    </p>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Base Fare</span>
                    <span>₹{bookingData.train.fare} × {bookingData.passengers.length}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">₹{bookingData.totalFare}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
