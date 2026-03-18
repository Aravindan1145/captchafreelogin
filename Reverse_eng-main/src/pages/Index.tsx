import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Train, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { isAuthenticated } from '@/utils/auth';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/search');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container relative mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Train className="w-16 h-16 text-secondary" />
              <h1 className="text-6xl font-bold text-white">Captcha Free RailBook</h1>
            </div>
            <p className="text-2xl text-white/90 mb-4">
              Captcha-Free Train Booking System
            </p>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Experience seamless train ticket booking with our advanced OTP-based authentication 
              and intelligent human verification system. No annoying CAPTCHAs!
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-white/10 text-white border-white/30 hover:bg-white/20"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose Captcha Free RailBook?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Smart</h3>
              <p className="text-muted-foreground">
                Advanced behavioral analysis and device fingerprinting ensures only humans can access your account, 
                without the hassle of CAPTCHAs.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Book your tickets in seconds with our streamlined booking flow. 
                OTP-based login means faster authentication without compromising security.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Confirmation</h3>
              <p className="text-muted-foreground">
                Get complete ticket details including PNR, seat number, coach, and berth information 
                immediately after payment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Register or Login</h3>
                  <p className="text-muted-foreground">
                    Create your account or login without CAPTCHAs. Our system analyzes your behavior 
                    to verify you're human - no puzzle-solving required!
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Verify with OTP</h3>
                  <p className="text-muted-foreground">
                    Receive a one-time password via email and verify your identity securely. 
                    The OTP replaces traditional CAPTCHAs for human verification.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Search & Book</h3>
                  <p className="text-muted-foreground">
                    Browse available trains, select your preferred journey, add passenger details, 
                    and proceed to payment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Get Your Ticket</h3>
                  <p className="text-muted-foreground">
                    Complete secure payment and instantly receive your confirmed ticket with PNR, 
                    seat details, coach information, and journey timings.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="text-lg px-8"
              >
                Start Booking Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Train className="w-6 h-6 text-secondary" />
            <span className="text-xl font-bold">Captcha Free RailBook</span>
          </div>
          <p className="text-primary-foreground/70">
            Secure, Fast, and Captcha-Free Train Booking
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
