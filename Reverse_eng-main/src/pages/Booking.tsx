import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Train, Passenger } from '@/types/booking';
import { isAuthenticated } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

const Booking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [train, setTrain] = useState<Train | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([
    { name: '', age: 0, gender: 'Male', berth: 'No Preference' }
  ]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    const savedTrain = localStorage.getItem('selected_train');
    if (!savedTrain) {
      navigate('/search');
      return;
    }

    setTrain(JSON.parse(savedTrain));
  }, [navigate]);

  const addPassenger = () => {
    if (passengers.length < 6) {
      setPassengers([...passengers, { name: '', age: 0, gender: 'Male', berth: 'No Preference' }]);
    }
  };

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleProceedToPayment = () => {
    // Validate passengers
    for (const passenger of passengers) {
      if (!passenger.name || passenger.age <= 0 || passenger.age > 120) {
        toast({
          title: 'Invalid Data',
          description: 'Please fill all passenger details correctly',
          variant: 'destructive',
        });
        return;
      }
    }

    if (!train) return;

    const bookingData = {
      train,
      passengers,
      totalFare: train.fare * passengers.length
    };

    localStorage.setItem('pending_booking', JSON.stringify(bookingData));
    navigate('/payment');
  };

  if (!train) return null;

  const totalFare = train.fare * passengers.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/search')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Train Details */}
          <Card className="p-6 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
            <h2 className="text-2xl font-bold mb-4">
              {train.trainName} ({train.trainNumber})
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-primary-foreground/70 text-sm">From</p>
                <p className="font-semibold">{train.source}</p>
                <p className="text-sm">{train.departureTime}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">To</p>
                <p className="font-semibold">{train.destination}</p>
                <p className="text-sm">{train.arrivalTime}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">Journey Date</p>
                <p className="font-semibold">{train.date}</p>
              </div>
            </div>
          </Card>

          {/* Passenger Details */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Passenger Details</h3>
              <Button
                onClick={addPassenger}
                disabled={passengers.length >= 6}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Passenger
              </Button>
            </div>

            <div className="space-y-6">
              {passengers.map((passenger, index) => (
                <div key={index} className="p-4 border rounded-lg relative">
                  {passengers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removePassenger(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <h4 className="font-semibold mb-4">Passenger {index + 1}</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={passenger.name}
                        onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                    </div>

                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={passenger.age || ''}
                        onChange={(e) => updatePassenger(index, 'age', parseInt(e.target.value) || 0)}
                        placeholder="Age"
                        min="1"
                        max="120"
                      />
                    </div>

                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={passenger.gender}
                        onValueChange={(value) => updatePassenger(index, 'gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Berth Preference</Label>
                      <Select
                        value={passenger.berth}
                        onValueChange={(value) => updatePassenger(index, 'berth', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lower">Lower</SelectItem>
                          <SelectItem value="Middle">Middle</SelectItem>
                          <SelectItem value="Upper">Upper</SelectItem>
                          <SelectItem value="Side Lower">Side Lower</SelectItem>
                          <SelectItem value="Side Upper">Side Upper</SelectItem>
                          <SelectItem value="No Preference">No Preference</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Fare Summary */}
          <Card className="p-6 bg-muted/50">
            <h3 className="text-xl font-semibold mb-4">Fare Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Fare ({passengers.length} passenger{passengers.length > 1 ? 's' : ''})</span>
                <span>₹{train.fare} × {passengers.length}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total Amount</span>
                <span className="text-primary">₹{totalFare}</span>
              </div>
            </div>
          </Card>

          <Button
            onClick={handleProceedToPayment}
            className="w-full"
            size="lg"
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Booking;
