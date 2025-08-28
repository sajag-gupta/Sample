import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 10 }).notNull(),
  password: text("password"), // nullable for Google OAuth users
  isEmailVerified: varchar("is_email_verified", { length: 10 }).notNull().default("false"),
  googleId: varchar("google_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: varchar("is_used", { length: 10 }).notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type OTPCode = typeof otpCodes.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type OTPVerificationData = z.infer<typeof otpVerificationSchema>;
export type CreateNoteData = z.infer<typeof createNoteSchema>;
export type UpdateNoteData = z.infer<typeof updateNoteSchema>;
