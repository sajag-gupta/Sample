import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { OTPForm } from "@/components/auth/OTPForm";

type AuthView = "login" | "signup" | "otp";

interface OTPData {
  email: string;
  tempData?: any;
  isLogin?: boolean;
}

export default function AuthPage() {
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [otpData, setOTPData] = useState<OTPData | null>(null);

  const switchToLogin = () => setCurrentView("login");
  const switchToSignup = () => setCurrentView("signup");
  const switchToOTP = (email: string, tempData?: any, isLogin = false) => {
    setOTPData({ email, tempData, isLogin });
    setCurrentView("otp");
  };
  const backToSignup = () => {
    setCurrentView("signup");
    setOTPData(null);
  };

  const backToLogin = () => {
    setCurrentView("login");
    setOTPData(null);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Image (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 hero-image items-center justify-center p-12">
        <div className="max-w-md text-center">
          <img 
            src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
            alt="Person writing notes in a modern notebook" 
            className="rounded-2xl shadow-2xl mb-8 w-full h-auto" 
          />
          <h2 className="text-2xl font-bold text-foreground mb-4">Capture Your Ideas</h2>
          <p className="text-muted-foreground text-lg">
            Simple, elegant note-taking for your daily thoughts and inspiration.
          </p>
        </div>
      </div>

      {/* Right side - Authentication Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {currentView === "login" && (
            <LoginForm onSwitchToSignup={switchToSignup} onSwitchToOTP={switchToOTP} />
          )}
          {currentView === "signup" && (
            <SignupForm onSwitchToLogin={switchToLogin} onSwitchToOTP={switchToOTP} />
          )}
          {currentView === "otp" && otpData && (
            <OTPForm 
              email={otpData.email} 
              tempData={otpData.tempData}
              isLogin={otpData.isLogin}
              onBackToSignup={backToSignup}
              onBackToLogin={backToLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
}
