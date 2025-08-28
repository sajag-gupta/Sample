import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { otpVerificationSchema, type OTPVerificationData } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/logo_1756406310995.png";

interface OTPFormProps {
  email: string;
  tempData?: any;
  isLogin?: boolean;
  onBackToSignup: () => void;
  onBackToLogin?: () => void;
}

export function OTPForm({ email, tempData, isLogin = false, onBackToSignup, onBackToLogin }: OTPFormProps) {
  const { toast } = useToast();
  const { login } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const form = useForm<OTPVerificationData>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      email,
      code: "",
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: async (data: OTPVerificationData) => {
      const endpoint = isLogin ? "/api/auth/verify-login-otp" : "/api/auth/verify-otp";
      const payload = isLogin ? data : { ...data, tempData };
      const response = await apiRequest("POST", endpoint, payload);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.token);
      toast({
        title: isLogin ? "Welcome back!" : "Account created successfully!",
        description: isLogin ? "You have been successfully logged in." : "Welcome to NoteTaker!",
      });
      // For both login and signup, user should be redirected to dashboard
      // The login() call above will trigger this automatically via useAuth hook
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  const resendOTPMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-otp", {
        email,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to resend code",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OTPVerificationData) => {
    verifyOTPMutation.mutate(data);
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    resendOTPMutation.mutate();
    setTimeout(() => setIsResending(false), 3000);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 6 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    form.setValue("code", value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <img src={logoUrl} alt="NoteTaker HD Logo" className="h-12 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {isLogin ? "Enter Verification Code" : "Verify Email"}
        </h1>
        <p className="text-muted-foreground mt-2">
          We've sent a verification code to{" "}
          <span className="font-medium" data-testid="text-email">
            {email}
          </span>
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
            Verification Code
          </Label>
          <Input
            id="code"
            type="text"
            data-testid="input-otp"
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full text-center text-lg tracking-widest"
            {...form.register("code")}
            onChange={handleCodeChange}
          />
          {form.formState.errors.code && (
            <div className="error-message" data-testid="text-otp-error">
              {form.formState.errors.code.message}
            </div>
          )}
        </div>

        <Button
          type="submit"
          data-testid="button-verify"
          disabled={verifyOTPMutation.isPending}
          className="w-full btn-primary"
        >
          {verifyOTPMutation.isPending ? "Verifying..." : (isLogin ? "Sign In" : "Verify Email")}
        </Button>

        <div className="text-center">
          <p className="text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              type="button"
              data-testid="button-resend"
              onClick={handleResendOTP}
              disabled={isResending || resendOTPMutation.isPending}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {isResending || resendOTPMutation.isPending ? "Sending..." : "Resend OTP"}
            </button>
          </p>
        </div>
      </form>

      <div className="text-center">
        <button
          data-testid={isLogin ? "link-back-login" : "link-back-signup"}
          onClick={isLogin ? onBackToLogin : onBackToSignup}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back to {isLogin ? "login" : "signup"}
        </button>
      </div>
    </div>
  );
}
