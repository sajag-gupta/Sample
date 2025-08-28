import {
  users,
  notes,
  otpCodes,
  type User,
  type InsertUser,
  type Note,
  type InsertNote,
  type UpdateNoteData,
  type OTPCode,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'id'>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Note operations
  createNote(userId: string, note: InsertNote): Promise<Note>;
  getNotesByUserId(userId: string): Promise<Note[]>;
  updateNote(id: string, userId: string, updates: UpdateNoteData): Promise<Note | undefined>;
  deleteNote(id: string, userId: string): Promise<boolean>;
  getNote(id: string, userId: string): Promise<Note | undefined>;
  
  // OTP operations
  createOTPCode(email: string, code: string, expiresAt: Date): Promise<OTPCode>;
  getValidOTPCode(email: string, code: string): Promise<OTPCode | undefined>;
  markOTPAsUsed(id: string): Promise<void>;
  cleanupExpiredOTPs(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Omit<InsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Note operations
  async createNote(userId: string, noteData: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values({ ...noteData, userId })
      .returning();
    return note;
  }

  async getNotesByUserId(userId: string): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateNote(id: string, userId: string, updates: UpdateNoteData): Promise<Note | undefined> {
    const [note] = await db
      .update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    return note;
  }

  async getNote(id: string, userId: string): Promise<Note | undefined> {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
    return note;
  }

  // OTP operations
  async createOTPCode(email: string, code: string, expiresAt: Date): Promise<OTPCode> {
    const [otpCode] = await db
      .insert(otpCodes)
      .values({ email, code, expiresAt })
      .returning();
    return otpCode;
  }

  async getValidOTPCode(email: string, code: string): Promise<OTPCode | undefined> {
    const [otpCode] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, code),
          eq(otpCodes.isUsed, "false")
        )
      );
    
    if (otpCode && new Date() <= otpCode.expiresAt) {
      return otpCode;
    }
    return undefined;
  }

  async markOTPAsUsed(id: string): Promise<void> {
    await db
      .update(otpCodes)
      .set({ isUsed: "true" })
      .where(eq(otpCodes.id, id));
  }

  async cleanupExpiredOTPs(): Promise<void> {
    await db
      .delete(otpCodes)
      .where(sql`expires_at < NOW()`);
  }
}

export const storage = new DatabaseStorage();
