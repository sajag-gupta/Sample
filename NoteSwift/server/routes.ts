import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateToken, 
  hashPassword, 
  verifyPassword, 
  authenticateToken,
  type AuthenticatedRequest 
} from "./auth";
import { sendOTPEmail, generateOTP } from "./services/emailService";
import { getGoogleAuthUrl, getGoogleUserFromCode, verifyGoogleToken } from "./services/googleAuth";
import { 
  loginSchema, 
  signupSchema, 
  otpVerificationSchema, 
  createNoteSchema,
  updateNoteSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const { name, dateOfBirth, email } = validatedData;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Generate and send OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOTPCode(email, otpCode, expiresAt);
      await sendOTPEmail(email, otpCode);

      // Store user data temporarily (you might want to use a session or temporary storage)
      res.json({ 
        message: "Verification code sent to your email",
        email,
        tempData: { name, dateOfBirth, email }
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ 
        message: error.issues ? "Validation error" : "Signup failed",
        errors: error.issues || [{ message: error.message }]
      });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code, tempData } = req.body;
      const validatedOTP = otpVerificationSchema.parse({ email, code });

      // Verify OTP
      const otpRecord = await storage.getValidOTPCode(validatedOTP.email, validatedOTP.code);
      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Mark OTP as used and create user (email verification complete)
      await storage.markOTPAsUsed(otpRecord._id);

      const newUser = await storage.createUser({
        name: tempData.name,
        dateOfBirth: tempData.dateOfBirth,
        email: tempData.email,
        isEmailVerified: "true"
      });

      const token = generateToken({ 
        userId: newUser._id.toString(), 
        email: newUser.email 
      });

      res.json({
        message: "Email verified successfully",
        token,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email
        }
      });
    } catch (error: any) {
      console.error("OTP verification error:", error);
      res.status(400).json({ 
        message: error.issues ? "Validation error" : "Verification failed",
        errors: error.issues || [{ message: error.message }]
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email } = validatedData;

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "No account found with this email. Please sign up first." });
      }

      // Check if email is verified
      if (user.isEmailVerified !== "true") {
        return res.status(401).json({ message: "Please verify your email before logging in" });
      }

      // Generate and send OTP for login
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOTPCode(email, otpCode, expiresAt);
      await sendOTPEmail(email, otpCode);

      res.json({
        message: "Verification code sent to your email",
        email
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: error.issues ? "Validation error" : "Login failed",
        errors: error.issues || [{ message: error.message }]
      });
    }
  });

  // New route for OTP verification during login
  app.post("/api/auth/verify-login-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      const validatedOTP = otpVerificationSchema.parse({ email, code });

      // Verify OTP
      const otpRecord = await storage.getValidOTPCode(validatedOTP.email, validatedOTP.code);
      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Mark OTP as used
      await storage.markOTPAsUsed(otpRecord._id);

      // Get user
      const user = await storage.getUserByEmail(validatedOTP.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate JWT
      const token = generateToken({ 
        userId: user._id.toString(), 
        email: user.email 
      });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        }
      });
    } catch (error: any) {
      console.error("Login OTP verification error:", error);
      res.status(400).json({ 
        message: error.issues ? "Validation error" : "Verification failed",
        errors: error.issues || [{ message: error.message }]
      });
    }
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate and send new OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOTPCode(email, otpCode, expiresAt);
      await sendOTPEmail(email, otpCode);

      res.json({ message: "New verification code sent to your email" });
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", (req, res) => {
    const authUrl = getGoogleAuthUrl();
    res.redirect(authUrl);
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Google token is required" });
      }

      // Verify Google token
      const googleUser = await verifyGoogleToken(token);

      // Check if user exists
      let user = await storage.getUserByEmail(googleUser.email);

      if (!user) {
        // Create new user
        user = await storage.createUser({
          name: googleUser.name,
          dateOfBirth: "1990-01-01", // Default for Google OAuth users
          email: googleUser.email,
          googleId: googleUser.id,
          isEmailVerified: "true"
        });
      } else if (!user.googleId) {
        // Link Google account to existing user
        user = await storage.updateUser(user._id.toString(), { googleId: googleUser.id });
      }

      // Generate JWT
      const jwtToken = generateToken({ userId: user._id.toString(), email: user.email });

      res.json({
        message: "Google authentication successful",
        token: jwtToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        }
      });
    } catch (error: any) {
      console.error("Google auth error:", error);
      res.status(400).json({ message: "Google authentication failed" });
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect("/?error=google_auth_failed");
      }

      const googleUser = await getGoogleUserFromCode(code as string);

      // Check if user exists
      let user = await storage.getUserByEmail(googleUser.email);

      if (!user) {
        // Create new user
        user = await storage.createUser({
          name: googleUser.name,
          dateOfBirth: "1990-01-01", // Default for Google OAuth users
          email: googleUser.email,
          googleId: googleUser.id,
          isEmailVerified: "true"
        });
      } else if (!user.googleId) {
        // Link Google account to existing user
        user = await storage.updateUser(user._id.toString(), { googleId: googleUser.id });
      }

      // Generate JWT
      const token = generateToken({ userId: user._id.toString(), email: user.email });

      // Redirect to frontend with token
      res.redirect(`/?token=${token}`);
    } catch (error: any) {
      console.error("Google callback error:", error);
      res.redirect("/?error=google_auth_failed");
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user._id.toString(),
        name: user.name,
        email: user.email
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });

  // Notes routes
  app.get("/api/notes", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const notes = await storage.getNotesByUserId(req.user!.userId);
      res.json(notes);
    } catch (error) {
      console.error("Get notes error:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = createNoteSchema.parse(req.body);
      const note = await storage.createNote(req.user!.userId, validatedData);
      res.status(201).json(note);
    } catch (error: any) {
      console.error("Create note error:", error);
      res.status(400).json({ 
        message: error.issues ? "Validation error" : "Failed to create note",
        errors: error.issues || [{ message: error.message }]
      });
    }
  });

  app.put("/api/notes/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateNoteSchema.parse(req.body);

      const updatedNote = await storage.updateNote(id, req.user!.userId, validatedData);

      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.json(updatedNote);
    } catch (error: any) {
      console.error("Update note error:", error);
      res.status(400).json({ 
        message: error.issues ? "Validation error" : "Failed to update note",
        errors: error.issues || [{ message: error.message }]
      });
    }
  });

  app.delete("/api/notes/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteNote(id, req.user!.userId);

      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Delete note error:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Cleanup expired OTPs periodically
  setInterval(async () => {
    try {
      await storage.cleanupExpiredOTPs();
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
    }
  }, 60 * 60 * 1000); // Every hour

  const httpServer = createServer(app);
  return httpServer;
}