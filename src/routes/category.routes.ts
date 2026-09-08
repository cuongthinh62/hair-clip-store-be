import { Router } from 'express'
import {
  getCategories,
  getCategoryById,
  getProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// Public Routes (Không cần đăng nhập)
router.get('/', getCategories)
router.get('/:id', getCategoryById)
router.get('/:id/products', getProductsByCategory)

// Protected Routes (Bắt buộc phải có Bearer Token)
router.post('/', authenticate, createCategory)
router.put('/:id', authenticate, updateCategory)
router.delete('/:id', authenticate, deleteCategory)

export default router
