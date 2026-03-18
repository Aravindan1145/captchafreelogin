import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { OTPInput } from '@/components/OTPInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { registerUser, generateOTP, verifyOTP, isAuthenticated } from '@/utils/auth';
import { BehaviorTracker, getDeviceFingerprint, calculateHumanScore } from '@/utils/behaviorTracking';
import { useToast } from '@/hooks/use-toast';
import { Train, Shield, CheckCircle2, Clock } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'credentials' | 'otp' | 'irctc-display'>('credentials');
  const [tracker] = useState(() => new BehaviorTracker());
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [displayedOTP, setDisplayedOTP] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP countdown states
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [userMobile, setUserMobile] = useState('');
  
  // IRCTC credentials
  const [generatedIRCTCUserId, setGeneratedIRCTCUserId] = useState('');
  const [generatedIRCTCPassword, setGeneratedIRCTCPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/search');
    }
    return () => tracker.cleanup();
  }, [navigate, tracker]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && step === 'otp' && !otpSent) {
      // Automatically send OTP after countdown
      handleSendOTP();
    }
  }, [countdown, step, otpSent]);

  const handleSendOTP = async () => {
    try {
      const { otp, email: userEmail, mobile } = generateOTP(username, password);
      setDisplayedOTP(otp);
      setUserMobile(mobile);
      setOtpSent(true);
      
      // Mask mobile number for display
      const maskedMobile = mobile.replace(/(\d{2})(\d{4})(\d{4})/, '$1-XXXX-$3');
      
      toast({
        title: 'OTP Sent Successfully',
        description: `OTP sent to +91-${maskedMobile} via SMS`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Send OTP',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleResendOTP = () => {
    setCountdown(45);
    setOtpSent(false);
    setDisplayedOTP('');
    setUserMobile('');
    toast({
      title: 'Resending OTP',
      description: 'Please wait 45 seconds for a new OTP',
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fullName || !email || !mobile || !password) {
        throw new Error('All fields are required');
      }

      if (!/^[6-9]\d{9}$/.test(mobile)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const result = registerUser(fullName, email, mobile, password);
      
      setGeneratedIRCTCUserId(result.irctcUserId);
      setGeneratedIRCTCPassword(result.irctcPassword);
      setStep('irctc-display');
      
      toast({
        title: 'Registration Successful',
        description: 'Your IRCTC credentials have been generated',
      });
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check honeypot
      if (honeypot) {
        throw new Error('Bot detected');
      }

      // Get behavioral data
      const behaviorPayload = tracker.getPayload();
      const deviceFingerprint = getDeviceFingerprint();
      const humanScore = calculateHumanScore(behaviorPayload, deviceFingerprint);

      console.log('Human Score:', humanScore);

      if (humanScore < 0.4) {
        toast({
          title: 'Verification Failed',
          description: 'Unusual activity detected. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (humanScore < 0.7) {
        toast({
          title: 'Additional Verification',
          description: 'Your activity seems unusual. Please complete the OTP verification.',
        });
      }

      // Start 45-second countdown
      setCountdown(45);
      setOtpSent(false);
      setDisplayedOTP('');
      setStep('otp');
      
      toast({
        title: 'Please Wait',
        description: 'Your OTP will be sent after 45 seconds',
      });
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    setLoading(true);
    try {
      const result = verifyOTP(username, otp);
      
      if (result.success) {
        const userName = result.user?.fullName || result.user?.username || 'User';
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userName}!`,
        });
        navigate('/search');
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Train className="w-10 h-10 text-secondary" />
            <h1 className="text-4xl font-bold text-white">Captcha Free RailBook</h1>
          </div>
          <p className="text-white/80">Captcha-Free Secure Login</p>
        </div>

        <Card className="p-8">
          {step === 'credentials' ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-username">IRCTC User ID / Username</Label>
                    <Input
                      id="login-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your IRCTC User ID"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="login-password">Password / IRCTC Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Honeypot field - hidden from users */}
                  <Label htmlFor="login-honeypot" className="sr-only">Do not fill this field</Label>
                  <input
                    id="login-honeypot"
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="honeypot-input"
                    tabIndex={-1}
                    autoComplete="off"
                    title="Leave this field empty"
                    placeholder="Don't fill this field"
                  />

                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <Shield className="w-4 h-4" />
                    <span>Protected by behavioral analysis</span>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : 'Continue to OTP'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-fullname">Full Name</Label>
                    <Input
                      id="reg-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-mobile">Mobile Number</Label>
                    <Input
                      id="reg-mobile"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-email">Gmail / Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 6 characters
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Continue'}
                  </Button>
                </form>
              </TabsContent>

            </Tabs>
          ) : step === 'irctc-display' ? (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Account Created Successfully!</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Your IRCTC-style credentials have been generated. Please save them securely.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg border-2 border-primary/20">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">IRCTC User ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
                          value={generatedIRCTCUserId} 
                          readOnly 
                          className="font-mono font-semibold text-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedIRCTCUserId);
                            toast({ title: 'Copied!', description: 'User ID copied to clipboard' });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">IRCTC Password</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
                          value={generatedIRCTCPassword} 
                          readOnly 
                          className="font-mono font-semibold text-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedIRCTCPassword);
                            toast({ title: 'Copied!', description: 'Password copied to clipboard' });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Important:</strong> Save these credentials securely. You can use either your IRCTC credentials or original credentials to login.
                    </span>
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setStep('credentials');
                  setActiveTab('login');
                  setFullName('');
                  setEmail('');
                  setMobile('');
                  setPassword('');
                }}
              >
                Continue to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {!otpSent ? (
                <>
                  <div className="text-center">
                    <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-semibold mb-2">Preparing Your OTP</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please hold on while to verify you're human
                    </p>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {countdown}s
                    </div>
                    <p className="text-xs text-muted-foreground">
                      OTP will be sent to your registered mobile number via SMS
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Progress value={((45 - countdown) / 45) * 100} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {countdown > 0 ? `${countdown} seconds remaining` : 'Sending OTP...'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">OTP Sent Successfully</h3>
                    <p className="text-sm text-muted-foreground">
                      A 6-digit code has been sent to your registered mobile number via SMS
                    </p>
                    {userMobile && (
                      <p className="text-xs text-muted-foreground mt-2 font-mono">
                        Sent to: +91-{userMobile.replace(/(\d{2})(\d{4})(\d{4})/, '$1-XXXX-$3')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Valid for 5 minutes 
                    </p>
                  </div>

                  <OTPInput onComplete={handleOTPVerify} />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleResendOTP}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={() => {
                        setStep('credentials');
                        setDisplayedOTP('');
                        setOtpSent(false);
                        setCountdown(0);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
