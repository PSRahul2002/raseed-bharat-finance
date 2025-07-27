import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGoogleAuth, GoogleUser } from '@/hooks/use-google-auth';
import { Wallet, Mail, Shield, ArrowRight, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Google Authentication Handler
  const handleGoogleSuccess = (user: GoogleUser) => {
    setGoogleLoading(true);
    
    // Use the user's actual email and name from Google
    login(user.email, user.name);
    
    toast({
      title: "Welcome back!",
      description: `Signed in as ${user.name}`,
    });
    
    setGoogleLoading(false);
  };

  const handleGoogleError = (error: string) => {
    setGoogleLoading(false);
    toast({
      title: "Google Sign-in Failed",
      description: error,
      variant: "destructive",
    });
  };

  const { renderGoogleButton, isGoogleLoaded } = useGoogleAuth({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    autoSelect: false,
  });

  // Render Google button when component mounts and Google is loaded
  useEffect(() => {
    if (isGoogleLoaded && googleButtonRef.current) {
      // Clear any existing content
      googleButtonRef.current.innerHTML = '';
      renderGoogleButton('google-signin-button', {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: '320', // Use pixel value instead of percentage
      });
    }
  }, [isGoogleLoaded, renderGoogleButton]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
      toast({
        title: "OTP Sent!",
        description: `Verification code sent to ${email}`,
      });
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      login(email, email.split('@')[0]);
      setLoading(false);
      toast({
        title: "Welcome to Raseed!",
        description: "You're now logged in to your finance assistant.",
      });
    }, 1000);
  };

  const handleGoogleLogin = () => {
    // This is now handled by the Google button component
    // Fallback for if the Google button doesn't work
    if (!isGoogleLoaded) {
      toast({
        title: "Google Sign-in Unavailable",
        description: "Please try again or use email login.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[var(--shadow-medium)]">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Raseed</h1>
          <p className="text-muted-foreground">Your smart finance assistant for India</p>
        </div>

        {/* Login Form */}
        <div className="raseed-card p-6 space-y-6">
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 raseed-input"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading || !email}
                className="w-full raseed-button-primary"
              >
                {loading ? 'Sending...' : 'Send OTP'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Verification Code</label>
                <div className="relative">
                  <Shield className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="pl-10 raseed-input text-center tracking-wider"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Code sent to {email}
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={loading || otp.length !== 6}
                className="w-full raseed-button-primary"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOtpSent(false)}
                className="w-full text-muted-foreground"
              >
                Change email address
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <div className="space-y-2">
            {/* Google Identity Services Button */}
            <div
              id="google-signin-button"
              ref={googleButtonRef}
              className="w-full flex justify-center"
              style={{ minHeight: '48px' }}
            />            {/* Fallback button if Google Services don't load */}
            {!isGoogleLoaded && (
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                disabled={googleLoading}
                className="w-full border-border hover:bg-muted"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>
            )}
            
            {/* Loading indicator for Google auth */}
            {googleLoading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Signing you in...</span>
              </div>
            )}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            🔒 Your data is encrypted and secure
          </p>
          <p className="text-xs text-muted-foreground">
            Made in India for Indian users
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;