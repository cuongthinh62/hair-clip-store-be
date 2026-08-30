import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Product } from '../models/Product'

// ================== TYPES ==================
interface GetProductsQuery {
  page?: string
  limit?: string
  search?: string
  categoryId?: string
  color?: string
  isFeatured?: string
  bestSeller?: string
  sortBy?: 'createdAt' | 'price' | 'soldQuantity'
  sortOrder?: 'asc' | 'desc'
}

// ================== HELPERS ==================
const ALLOWED_SORT_FIELDS = ['createdAt', 'price', 'soldQuantity']

const parseBoolean = (value?: string): boolean | undefined => {
  if (value === undefined) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

/**
 * GET /api/v1/products
 * Lấy danh sách sản phẩm: phân trang + filter + tìm kiếm + sắp xếp
 */
export const getProducts = async (req: Request<{}, {}, {}, GetProductsQuery>, res: Response) => {
  try {
    const { search, categoryId, color, isFeatured, bestSeller, sortBy, sortOrder } = req.query

    // --- Phân trang ---
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    const skip = (page - 1) * limit

    // --- Xây dựng filter ---
    const filter: Record<string, any> = { isActive: true }

    if (search && search.trim() !== '') {
      filter.productName = { $regex: search.trim(), $options: 'i' }
    }

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          statusCode: 400,
          message: 'categoryId không hợp lệ',
          data: null
        })
      }
      filter.categoryId = categoryId
    }

    if (color) {
      filter.color = color
    }

    const isFeaturedBool = parseBoolean(isFeatured)
    if (isFeaturedBool !== undefined) {
      filter.isFeatured = isFeaturedBool
    }

    const bestSellerBool = parseBoolean(bestSeller)
    if (bestSellerBool !== undefined) {
      filter.bestSeller = bestSellerBool
    }

    // --- Sắp xếp ---
    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy as string) ? (sortBy as string) : 'createdAt'
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection }

    // --- Truy vấn ---
    // .populate('categoryId', ...) giúp trả về object {_id, categoryName, slug}
    // thay vì chỉ ObjectId thô, để frontend hiển thị đúng tên/slug danh mục
    const [items, totalItems] = await Promise.all([
      Product.find(filter).populate('categoryId', 'categoryName slug').sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ])

    const totalPages = Math.ceil(totalItems / limit) || 0

    return res.status(200).json({
      statusCode: 200,
      message: 'Lấy danh sách sản phẩm thành công',
      data: items,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('❌ Lỗi getProducts:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * GET /api/v1/products/:id
 * Lấy chi tiết sản phẩm theo ID
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'ID sản phẩm không hợp lệ',
        data: null
      })
    }

    const product = await Product.findOne({ _id: id, isActive: true }).populate('categoryId', 'categoryName slug')

    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy sản phẩm',
        data: null
      })
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: product
    })
  } catch (error) {
    console.error('❌ Lỗi getProductById:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * GET /api/v1/products/slug/:slug
 * Lấy chi tiết sản phẩm theo Slug (dùng cho trang chi tiết / SEO)
 */
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params

    const product = await Product.findOne({ slug, isActive: true }).populate('categoryId', 'categoryName slug')

    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy sản phẩm',
        data: null
      })
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: product
    })
  } catch (error) {
    console.error('❌ Lỗi getProductBySlug:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}
