"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ isOpen, onOpenChange }: AuthDialogProps) {
  // General State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Email State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isOTPVisible, setIsOTPVisible] = useState(false);

  const getErrorMessage = (errCode: string) => {
    switch (errCode) {
      case "auth/invalid-credential": return "Incorrect email or password.";
      case "auth/user-not-found": return "No account found. Please click Create Account.";
      case "auth/email-already-in-use": return "Email already exists.";
      case "auth/weak-password": return "Password should be at least 6 characters.";
      case "auth/invalid-email": return "Invalid email address.";
      case "auth/invalid-phone-number": return "Invalid phone number (use international format e.g., +62).";
      case "auth/invalid-verification-code": return "Incorrect OTP code.";
      case "auth/too-many-requests": return "Too many requests. Try again later.";
      default: return `Error: ${errCode}`;
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = result;
      setIsOTPVisible(true);
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.error(e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await window.confirmationResult.confirm(verificationCode);
      onOpenChange(false);
      setPhoneNumber("");
      setVerificationCode("");
      setIsOTPVisible(false);
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = () => {
    setError("");
    setIsOTPVisible(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            CandipiroAI
          </DialogTitle>
          <DialogDescription className="text-center">
            Log in to save your conversation history
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 font-medium" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Tabs defaultValue="email" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* EMAIL TAB */}
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs ml-2">{error}</AlertDescription></Alert>}
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Loading..." : "Sign In"}</Button>
              </form>
            </TabsContent>

            {/* PHONE TAB */}
            <TabsContent value="phone">
              {!isOTPVisible ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" placeholder="+6281234567890" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                    <p className="text-[10px] text-muted-foreground">Must include country code (e.g., +62)</p>
                  </div>
                  {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs ml-2">{error}</AlertDescription></Alert>}
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Sending SMS..." : "Send OTP Code"}</Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Verification Code (OTP)</Label>
                    <Input type="text" placeholder="123456" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required />
                  </div>
                  {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs ml-2">{error}</AlertDescription></Alert>}
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Verifying..." : "Verify & Sign In"}</Button>
                  <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => setIsOTPVisible(false)} disabled={isLoading}>Back</Button>
                </form>
              )}
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register">
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs ml-2">{error}</AlertDescription></Alert>}
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Loading..." : "Create Account"}</Button>
              </form>
            </TabsContent>

          </Tabs>
        </div>
        <div id="recaptcha-container"></div>
      </DialogContent>
    </Dialog>
  );
}
