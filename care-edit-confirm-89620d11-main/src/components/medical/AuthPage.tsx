import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Stethoscope, Users, UserPlus, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const AuthPage = () => {
  const { login, registerDoctor, registerPatient, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('doctor-login');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>, userType: 'doctor' | 'patient' | 'admin') => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const credentials = {
      id: formData.get('id') as string,
      password: formData.get('password') as string
    };
    
    await login(userType, credentials);
  };

  const handleDoctorRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const doctorData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      specialization: formData.get('specialization') as string,
      licenseNumber: formData.get('licenseNumber') as string,
    };
    
    const success = await registerDoctor(doctorData);
    if (success) {
      setActiveTab('doctor-login');
    }
  };

  const handlePatientRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const patientData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    };
    
    const success = await registerPatient(patientData);
    if (success) {
      setActiveTab('patient-login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-medical flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Smart Health Monitoring</h1>
            <p className="text-white/80">Healing Hands, Helping Hearts</p>
          </div>

          <Card className="shadow-medical backdrop-blur-sm bg-white/95">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl bg-gradient-medical bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription>
                Access your medical dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="doctor-login" className="text-xs">
                    <Stethoscope className="w-3 h-3 mr-1" />
                    Doctor
                  </TabsTrigger>
                  <TabsTrigger value="patient-login" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Patient
                  </TabsTrigger>
                  <TabsTrigger value="admin-login" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="doctor-login" className="mt-6">
                  <form onSubmit={(e) => handleLogin(e, 'doctor')} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctor-id">Doctor ID</Label>
                      <Input
                        id="doctor-id"
                        name="id"
                        placeholder="Enter your Doctor ID"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctor-password">Password</Label>
                      <Input
                        id="doctor-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-medical hover:shadow-card-hover transition-all" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</> : 'Login as Doctor'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="patient-login" className="mt-6">
                  <form onSubmit={(e) => handleLogin(e, 'patient')} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient-id">Medical ID</Label>
                      <Input
                        id="patient-id"
                        name="id"
                        placeholder="Enter your Medical ID"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-password">Password</Label>
                      <Input
                        id="patient-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-medical hover:shadow-card-hover transition-all" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</> : 'Login as Patient'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="admin-login" className="mt-6">
                  <form onSubmit={(e) => handleLogin(e, 'admin')} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-id">Admin ID</Label>
                      <Input
                        id="admin-id"
                        name="id"
                        placeholder="Enter admin ID"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        name="password"
                        type="password"
                        placeholder="Enter password"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-medical hover:shadow-card-hover transition-all" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</> : 'Login as Admin'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Default Admin: ADMIN001 / admin123
                    </p>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('doctor-register')}
                    className="text-xs"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Doctor Signup
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('patient-register')}
                    className="text-xs"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Patient Signup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Registration Form */}
          {activeTab === 'doctor-register' && (
            <Card className="mt-4 shadow-medical backdrop-blur-sm bg-white/95">
              <CardHeader>
                <CardTitle className="text-xl">Doctor Registration</CardTitle>
                <CardDescription>Join our healthcare network (requires admin approval)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDoctorRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-name">Full Name</Label>
                    <Input id="doc-name" name="name" placeholder="Dr. John Doe" required disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-email">Email</Label>
                    <Input id="doc-email" name="email" type="email" placeholder="doctor@example.com" required disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-specialization">Specialization</Label>
                    <Input id="doc-specialization" name="specialization" placeholder="Cardiology" required disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-licenseNumber">License Number</Label>
                    <Input id="doc-licenseNumber" name="licenseNumber" placeholder="LIC-2024-XXX" required disabled={isLoading} />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-medical" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Application'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('doctor-login')}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Patient Registration Form */}
          {activeTab === 'patient-register' && (
            <Card className="mt-4 shadow-medical backdrop-blur-sm bg-white/95">
              <CardHeader>
                <CardTitle className="text-xl">Patient Registration</CardTitle>
                <CardDescription>Apply for medical monitoring access (requires admin approval)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePatientRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pat-name">Full Name</Label>
                    <Input id="pat-name" name="name" placeholder="John Smith" required disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pat-email">Email</Label>
                    <Input id="pat-email" name="email" type="email" placeholder="patient@example.com" required disabled={isLoading} />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-medical" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Application'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('patient-login')}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:block text-center text-white">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-white/20 rounded-3xl mb-6 backdrop-blur-sm">
              <Stethoscope className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Your Health, Our Priority</h2>
            <p className="text-xl text-white/80 mb-8">
              Comprehensive medical report management system for healthcare professionals and patients.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">24/7</div>
              <div className="text-sm text-white/70">Access</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-sm text-white/70">Secure</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">Fast</div>
              <div className="text-sm text-white/70">Reports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
