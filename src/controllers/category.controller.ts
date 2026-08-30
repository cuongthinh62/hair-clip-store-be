import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Category } from '../models/Category'
import { Product } from '../models/Product'

// ================== TYPES ==================
interface GetProductsByCategoryQuery {
  page?: string
  limit?: string
  sortBy?: 'createdAt' | 'price' | 'soldQuantity'
  sortOrder?: 'asc' | 'desc'
}

const ALLOWED_SORT_FIELDS = ['createdAt', 'price', 'soldQuantity']

/**
 * GET /api/v1/categories
 * Lấy toàn bộ danh mục (không phân trang)
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      createdAt: -1
    })

    return res.status(200).json({
      statusCode: 200,
      message: 'Lấy danh sách danh mục thành công',
      data: categories
    })
  } catch (error) {
    console.error('Lỗi getCategories:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * GET /api/v1/categories/:id/products
 * Lấy danh sách sản phẩm thuộc 1 danh mục (có phân trang + sort)
 */
export const getProductsByCategory = async (
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  req: Request<{ id: string }, {}, {}, GetProductsByCategoryQuery>,
  res: Response
) => {
  try {
    const { id } = req.params
    const { sortBy, sortOrder } = req.query
    console.log(id)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'ID danh mục không hợp lệ',
        data: null
      })
    }

    // Kiểm tra danh mục có tồn tại không
    const category = await Category.findOne({ _id: id, isActive: true })
    if (!category) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy danh mục',
        data: null
      })
    }

    // --- Phân trang ---
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    const skip = (page - 1) * limit

    // --- Sắp xếp ---
    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy as string) ? (sortBy as string) : 'createdAt'
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection }

    const filter = { categoryId: id, isActive: true }

    const [items, totalItems] = await Promise.all([
      Product.find(filter).populate('categoryId').sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ])

    const totalPages = Math.ceil(totalItems / limit) || 0

    return res.status(200).json({
      statusCode: 200,
      message: 'Lấy danh sách sản phẩm theo danh mục thành công',
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
    console.error('Lỗi getProductsByCategory:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}
