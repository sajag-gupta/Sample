import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginData } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "../../../../attached_assets/logo_1756406310995.png";

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToOTP: (email: string, isLogin?: boolean) => void;
}

export function LoginForm({ onSwitchToSignup, onSwitchToOTP }: LoginFormProps) {
  const { toast } = useToast();
  const { login } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification code sent",
        description: "Please check your email and enter the verification code to sign in.",
      });
      // Switch to OTP verification for login
      onSwitchToOTP(data.email, undefined, true);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your email and try again",
        variant: "destructive",
      });
    },
  });

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      // Load Google Sign-In API
      await loadGoogleSignInAPI();

      // Initialize and sign in
      const auth2 = window.gapi.auth2.getAuthInstance();
      const user = await auth2.signIn();
      const idToken = user.getAuthResponse().id_token;

      // Send token to backend
      const response = await apiRequest("POST", "/api/auth/google", { token: idToken });
      const data = await response.json();

      login(data.token);
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google.",
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Google Sign-In failed",
        description: "Unable to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <img src={logoUrl} alt="NoteTaker HD Logo" className="h-12 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            data-testid="input-email"
            placeholder="Enter your email"
            {...form.register("email")}
            className="w-full"
          />
          {form.formState.errors.email && (
            <div className="error-message" data-testid="text-email-error">
              {form.formState.errors.email.message}
            </div>
          )}
        </div>


        <Button
          type="submit"
          data-testid="button-login"
          disabled={loginMutation.isPending}
          className="w-full btn-primary"
        >
          {loginMutation.isPending ? "Sending code..." : "Send Verification Code"}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          data-testid="button-google-login"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isGoogleLoading ? "Connecting..." : "Continue with Google"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <button
            data-testid="link-signup"
            onClick={onSwitchToSignup}
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

// Helper function to load Google Sign-In API
function loadGoogleSignInAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.gapi !== "undefined" && window.gapi.auth2) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api:client.js";
    script.onload = () => {
      window.gapi.load("auth2", () => {
        window.gapi.auth2.init({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id",
        }).then(resolve, reject);
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    gapi: any;
  }
}