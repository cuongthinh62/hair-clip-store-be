import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'node:dns'

// Import tất cả Model để Mongoose đăng ký Schema
import { User } from './models/User'
import { Product } from './models/Product'
import { SiteSetting } from './models/SiteSetting'
import { Category } from './models/Category'

dotenv.config()

// Ép DNS phân giải IPv4 tránh lỗi kết nối SRV
dns.setServers(['1.1.1.1', '8.8.8.8'])

const syncIndexesAndCollections = async () => {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('Chưa khai báo MONGO_URI trong .env')
    }

    console.log('🔄 Đang kết nối tới MongoDB...')
    await mongoose.connect(mongoUri)

    console.log('Đang khởi tạo các Collection và Indexes...')

    // Ép gọi các Model để đảm bảo chúng đã được nạp vào Mongoose Registry
    const modelList = [User, Product, SiteSetting, Category]

    for (const model of modelList) {
      // Tạo Collection trên Database nếu chưa tồn tại
      await model.createCollection()

      // Đồng bộ các Indexes (unique, search index...)
      await model.syncIndexes()

      console.log(`Đã đồng bộ bảng: ${model.collection.name}`)
    }

    console.log('Đồng bộ toàn bộ bảng thành công!')
    process.exit(0)
  } catch (error) {
    console.error('Lỗi khi đồng bộ bảng:', error)
    process.exit(1)
  }
}

syncIndexesAndCollections()
