import mongoose from 'mongoose'

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/filmvault'

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(uri)
    console.log(`[Database] MongoDB connected successfully to: ${mongoose.connection.host}`)
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error)
    // We don't hard exit so the server can still run or notify client
  }
}
