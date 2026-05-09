import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const g = globalThis as typeof globalThis & {
  mongooseConn?: Promise<typeof mongoose>;
};

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!g.mongooseConn) {
    g.mongooseConn = mongoose.connect(MONGODB_URI);
  }
  return g.mongooseConn;
}
