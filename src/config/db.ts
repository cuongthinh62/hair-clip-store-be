import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI

    if (!mongoUri) {
      throw new Error('Chưa khai báo MONGO_URI trong file .env')
    }

    await mongoose.connect(mongoUri)
    console.log('✅ Đã kết nối MongoDB thành công!')
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error)
    process.exit(1)
  }
}
