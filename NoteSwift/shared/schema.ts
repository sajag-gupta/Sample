
import mongoose from 'mongoose';
import { z } from 'zod';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, maxlength: 255 },
  name: { type: String, required: true, maxlength: 255 },
  dateOfBirth: { type: String, required: true, maxlength: 10 },
  password: { type: String, required: false }, // nullable for Google OAuth users
  isEmailVerified: { type: String, required: true, default: "false", maxlength: 10 },
  googleId: { type: String, maxlength: 255 },
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Notes Schema
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 255 },
  content: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

// OTP Codes Schema
const otpCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, maxlength: 255 },
  code: { type: String, required: true, maxlength: 6 },
  expiresAt: { type: Date, required: true },
  isUsed: { type: String, required: true, default: "false", maxlength: 10 },
}, {
  timestamps: true
});

// Create indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });
otpCodeSchema.index({ email: 1, code: 1 });
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Export models
export const User = mongoose.model('User', userSchema);
export const Note = mongoose.model('Note', noteSchema);
export const OTPCode = mongoose.model('OTPCode', otpCodeSchema);

// Validation schemas (keeping the same as before)
export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  dateOfBirth: z.string(),
  password: z.string().optional(),
  isEmailVerified: z.string().optional(),
  googleId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().min(10, "Please enter a valid date of birth"),
  email: z.string().email("Please enter a valid email address"),
}).refine((data) => {
  const date = new Date(data.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  return age >= 13 && age <= 120;
}, {
  message: "You must be at least 13 years old",
  path: ["dateOfBirth"],
});

export const otpVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const insertNoteSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
}).refine((data) => data.title !== undefined || data.content !== undefined, {
  message: "At least one field must be provided",
});

// Types
export type UserType = {
  _id: string;
  email: string;
  name: string;
  dateOfBirth: string;
  password?: string;
  isEmailVerified: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NoteType = {
  _id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OTPCodeType = {
  _id: string;
  email: string;
  code: string;
  expiresAt: Date;
  isUsed: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type OTPVerificationData = z.infer<typeof otpVerificationSchema>;
export type CreateNoteData = z.infer<typeof createNoteSchema>;
export type UpdateNoteData = z.infer<typeof updateNoteSchema>;
