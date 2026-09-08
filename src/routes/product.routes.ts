import { Router } from 'express'
import {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// Public Routes (Không yêu cầu đăng nhập)
router.get('/', getProducts)
router.get('/slug/:slug', getProductBySlug) // Đặt trước /:id để tránh trùng khớp route
router.get('/:id', getProductById)

// Protected Routes (Yêu cầu Token xác thực)
router.post('/', authenticate, createProduct)
router.put('/:id', authenticate, updateProduct)
router.delete('/:id', authenticate, deleteProduct)

export default router
