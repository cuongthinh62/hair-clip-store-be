import { Router } from 'express'
import { getCategories, getProductsByCategory } from '../controllers/category.controller'

const router = Router()

// GET /api/v1/categories
router.get('/', getCategories)

// GET /api/v1/categories/:id/products
router.get('/:id/products', getProductsByCategory)

export default router
