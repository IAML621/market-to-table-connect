import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ensureConsumerRecordExists } from '@/integrations/supabase/storage';

type Step = 'account' | 'details';
type UserRole = 'consumer' | 'farmer';

const Register = () => {
  const [step, setStep] = useState<Step>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [location, setLocation] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [error, setError] = useState('');
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = () => {
    if (!email || !password || !username) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Starting registration process...');
      
      // Register the user with authentication info
      const result = await signUp(email, password, username, role, role === 'consumer' ? location : undefined);
      console.log('Registration successful!', result);
      
      // The user object should be in the AuthContext now
      // The associated consumer/farmer record is created in the AuthContext
      
      // Navigate to home page after successful registration
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully"
      });
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to sign up. Please try again.');
      toast({
        title: "Registration failed",
        description: error.message || "There was a problem creating your account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <Package className="h-8 w-8 text-market-green" />
          </div>
          <h1 className="text-2xl font-bold">Create your Market Connect account</h1>
          <p className="text-muted-foreground mt-2">Connect with local farmers and fresh produce</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={step === 'account' ? (e) => { e.preventDefault(); handleContinue(); } : handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {step === 'account' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>I am a:</Label>
                    <RadioGroup value={role} onValueChange={(val) => setRole(val as UserRole)} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="consumer" id="consumer" />
                        <Label htmlFor="consumer">Consumer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="farmer" id="farmer" />
                        <Label htmlFor="farmer">Farmer</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-market-green hover:bg-market-green-dark"
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  {role === 'consumer' ? (
                    <div className="space-y-2">
                      <Label htmlFor="location">Your Location (Optional)</Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="City, State"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This helps us show you nearby farms and products
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="farmName">Farm Name (Optional)</Label>
                        <Input
                          id="farmName"
                          type="text"
                          placeholder="Green Acres Farm"
                          value={farmName}
                          onChange={(e) => setFarmName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="farmLocation">Farm Location (Optional)</Label>
                        <Input
                          id="farmLocation"
                          type="text"
                          placeholder="City, State"
                          value={farmLocation}
                          onChange={(e) => setFarmLocation(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep('account')}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-market-green hover:bg-market-green-dark"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
