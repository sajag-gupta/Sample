
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to set up MongoDB Atlas?",
  );
}

export async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export { mongoose };
