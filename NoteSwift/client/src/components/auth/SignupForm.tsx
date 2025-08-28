import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signupSchema, type SignupData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/logo_1756406310995.png";

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSwitchToOTP: (email: string, tempData: any) => void;
}

export function SignupForm({ onSwitchToLogin, onSwitchToOTP }: SignupFormProps) {
  const { toast } = useToast();

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      dateOfBirth: "",
      email: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data) => {
      onSwitchToOTP(data.email, data.tempData);
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleGoogleSignup = async () => {
    try {
      // Load Google Sign-In API
      await loadGoogleSignInAPI();
      
      // Initialize and sign in
      const auth2 = gapi.auth2.getAuthInstance();
      const user = await auth2.signIn();
      const idToken = user.getAuthResponse().id_token;

      // Send token to backend
      const response = await apiRequest("POST", "/api/auth/google", { token: idToken });
      const data = await response.json();

      // Since this is signup, we'll redirect to dashboard automatically
      window.location.href = `/?token=${data.token}`;
    } catch (error: any) {
      console.error("Google signup error:", error);
      toast({
        title: "Google Sign-Up failed",
        description: "Unable to sign up with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: SignupData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <img src={logoUrl} alt="NoteTaker HD Logo" className="h-12 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
        <p className="text-muted-foreground mt-2">Get started with your free account</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            data-testid="input-name"
            placeholder="Enter your full name"
            {...form.register("name")}
            className="w-full"
          />
          {form.formState.errors.name && (
            <div className="error-message" data-testid="text-name-error">
              {form.formState.errors.name.message}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground mb-2">
            Date of Birth
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            data-testid="input-dob"
            {...form.register("dateOfBirth")}
            className="w-full"
          />
          {form.formState.errors.dateOfBirth && (
            <div className="error-message" data-testid="text-dob-error">
              {form.formState.errors.dateOfBirth.message}
            </div>
          )}
        </div>

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
          data-testid="button-signup"
          disabled={signupMutation.isPending}
          className="w-full btn-primary"
        >
          {signupMutation.isPending ? "Creating Account..." : "Create Account"}
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
          data-testid="button-google-signup"
          onClick={handleGoogleSignup}
          className="w-full"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
      </form>

      <div className="text-center">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <button
            data-testid="link-login"
            onClick={onSwitchToLogin}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

// Helper function to load Google Sign-In API
function loadGoogleSignInAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof gapi !== "undefined" && gapi.auth2) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api:client.js";
    script.onload = () => {
      gapi.load("auth2", () => {
        gapi.auth2.init({
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

const gapi = window.gapi;
