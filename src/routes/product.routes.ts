import { Router } from 'express'
import {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller'

const router = Router()

// Lấy danh sách sản phẩm (Filter, Search, Phân trang)
router.get('/', getProducts)

// Lấy chi tiết sản phẩm theo Slug (Ví dụ: /api/v1/products/slug/kep-me-vai-voan)
router.get('/slug/:slug', getProductBySlug)

// Lấy chi tiết sản phẩm theo ID (Ví dụ: /api/v1/products/6a93dcee7b57b31481b56785)
router.get('/:id', getProductById)

// CRUD Admin
router.post('/', createProduct)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

export default router
