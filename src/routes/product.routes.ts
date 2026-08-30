import { Router } from 'express'
import { getProducts, getProductById, getProductBySlug } from '../controllers/product.controller'

const router = Router()

// GET /api/v1/products
router.get('/', getProducts)

// GET /api/v1/products/slug/:slug  (đặt trước /:id để tránh xung đột route)
router.get('/slug/:slug', getProductBySlug)

// GET /api/v1/products/:id
router.get('/:id', getProductById)

export default router
