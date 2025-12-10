import mongoose from "mongoose";

export async function connectAuthDB() {
  // Reuse existing connection when possible
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    const msg = 'No MongoDB URI found in environment (set MONGO_URI or MONGODB_URI)';
    console.error(msg);
    throw new Error(msg);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.AUTH_DB_NAME || 'finsyncdb',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
    return conn.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

export default connectAuthDB;