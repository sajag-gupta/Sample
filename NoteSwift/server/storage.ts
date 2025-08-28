
import {
  User,
  Note,
  OTPCode,
  type UserType,
  type NoteType,
  type OTPCodeType,
  type InsertUser,
  type InsertNote,
  type UpdateNoteData,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserType | null>;
  getUserByEmail(email: string): Promise<UserType | null>;
  getUserByGoogleId(googleId: string): Promise<UserType | null>;
  createUser(user: InsertUser): Promise<UserType>;
  updateUser(id: string, updates: Partial<UserType>): Promise<UserType | null>;
  
  // Note operations
  createNote(userId: string, note: InsertNote): Promise<NoteType>;
  getNotesByUserId(userId: string): Promise<NoteType[]>;
  updateNote(id: string, userId: string, updates: UpdateNoteData): Promise<NoteType | null>;
  deleteNote(id: string, userId: string): Promise<boolean>;
  getNote(id: string, userId: string): Promise<NoteType | null>;
  
  // OTP operations
  createOTPCode(email: string, code: string, expiresAt: Date): Promise<OTPCodeType>;
  getValidOTPCode(email: string, code: string): Promise<OTPCodeType | null>;
  markOTPAsUsed(id: string): Promise<void>;
  cleanupExpiredOTPs(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<UserType | null> {
    try {
      return await User.findById(id).lean();
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | null> {
    try {
      return await User.findOne({ email }).lean();
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<UserType | null> {
    try {
      return await User.findOne({ googleId }).lean();
    } catch (error) {
      console.error('Error getting user by Google ID:', error);
      return null;
    }
  }

  async createUser(userData: InsertUser): Promise<UserType> {
    try {
      const user = new User(userData);
      const savedUser = await user.save();
      return savedUser.toObject();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<UserType>): Promise<UserType | null> {
    try {
      return await User.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Note operations
  async createNote(userId: string, noteData: InsertNote): Promise<NoteType> {
    try {
      const note = new Note({ ...noteData, userId });
      const savedNote = await note.save();
      const noteObject = savedNote.toObject();
      return {
        ...noteObject,
        id: noteObject._id.toString()
      };
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  async getNotesByUserId(userId: string): Promise<NoteType[]> {
    try {
      const notes = await Note.find({ userId })
        .sort({ createdAt: -1 })
        .lean();
      
      return notes.map(note => ({
        ...note,
        id: note._id.toString()
      }));
    } catch (error) {
      console.error('Error getting notes by user ID:', error);
      return [];
    }
  }

  async updateNote(id: string, userId: string, updates: UpdateNoteData): Promise<NoteType | null> {
    try {
      const updatedNote = await Note.findOneAndUpdate(
        { _id: id, userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!updatedNote) return null;
      
      return {
        ...updatedNote,
        id: updatedNote._id.toString()
      };
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    try {
      const result = await Note.findOneAndDelete({ _id: id, userId });
      return result !== null;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  async getNote(id: string, userId: string): Promise<NoteType | null> {
    try {
      return await Note.findOne({ _id: id, userId }).lean();
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  }

  // OTP operations
  async createOTPCode(email: string, code: string, expiresAt: Date): Promise<OTPCodeType> {
    try {
      const otpCode = new OTPCode({ email, code, expiresAt });
      const savedOTP = await otpCode.save();
      return savedOTP.toObject();
    } catch (error) {
      console.error('Error creating OTP code:', error);
      throw error;
    }
  }

  async getValidOTPCode(email: string, code: string): Promise<OTPCodeType | null> {
    try {
      return await OTPCode.findOne({
        email,
        code,
        expiresAt: { $gt: new Date() },
        isUsed: "false"
      }).lean();
    } catch (error) {
      console.error('Error getting valid OTP code:', error);
      return null;
    }
  }

  async markOTPAsUsed(id: string): Promise<void> {
    try {
      await OTPCode.findByIdAndUpdate(id, { isUsed: "true" });
    } catch (error) {
      console.error('Error marking OTP as used:', error);
      throw error;
    }
  }

  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await OTPCode.deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } },
          { isUsed: "true" }
        ]
      });
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }
}

export const storage = new DatabaseStorage();
