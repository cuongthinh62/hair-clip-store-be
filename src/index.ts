import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import categoryRoutes from './routes/category.routes'
import productRoutes from './routes/product.routes'
import authRoutes from './routes/auth.routes'

dotenv.config()

require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8'])
import dns from 'node:dns/promises'
dns.setServers(['1.1.1.1', '8.8.8.8'])
// tắt 3 dòng trên để chạy local máy anh Thịnh

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

connectDB()

app.get('/', (req, res) => {
  res.json({ message: 'API Kẹp Tóc Thịnh Phát đang hoạt động!' })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/categories', categoryRoutes)

app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`)
})
