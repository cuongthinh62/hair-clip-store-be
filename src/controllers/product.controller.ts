import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Product } from '../models/Product'
import { Category } from '../models/Category'

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

// Helper tự động tạo slug chuẩn từ tên sản phẩm
const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/^-+|-+$/g, '')
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
    console.error(' Lỗi getProducts:', error)
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
    console.error(' Lỗi getProductById:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * GET /api/v1/products/slug/:slug
 * Lấy chi tiết sản phẩm theo Slug
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
    console.error(' Lỗi getProductBySlug:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * POST /api/v1/products
 * Tạo mới sản phẩm
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      productName,
      material,
      description,
      wholesalePrice,
      price,
      discountPrice,
      stockQuantity,
      color,
      occasion,
      imageUrl,
      bestSeller,
      isFeatured,
      isActive
    } = req.body

    // Validation các trường required theo Model
    if (!productName || !categoryId || price === undefined) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Tên sản phẩm (productName), danh mục (categoryId) và giá (price) là bắt buộc',
        data: null
      })
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'categoryId không hợp lệ',
        data: null
      })
    }

    // Kiểm tra danh mục có tồn tại không
    const categoryExists = await Category.findById(categoryId)
    if (!categoryExists) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Danh mục được chọn không tồn tại',
        data: null
      })
    }

    const slug = req.body.slug || generateSlug(productName)

    // Kiểm tra slug trùng lặp
    const existingSlug = await Product.findOne({ slug })
    if (existingSlug) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Slug sản phẩm đã tồn tại, vui lòng kiểm tra lại productName hoặc truyền slug riêng',
        data: null
      })
    }

    const newProduct = await Product.create({
      categoryId,
      productName,
      slug,
      material: material || '',
      description: description || '',
      wholesalePrice: wholesalePrice || 0,
      price,
      discountPrice: discountPrice || 0,
      stockQuantity: stockQuantity || 0,
      color: color || '',
      occasion: occasion || '',
      imageUrl: imageUrl || '',
      soldQuantity: 0,
      bestSeller: bestSeller || false,
      isFeatured: isFeatured || false,
      isActive: isActive !== undefined ? isActive : true
    })

    return res.status(201).json({
      statusCode: 201,
      message: 'Tạo sản phẩm thành công',
      data: newProduct
    })
  } catch (error: any) {
    console.error(' Lỗi createProduct:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * PUT /api/v1/products/:id
 * Cập nhật sản phẩm
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'ID sản phẩm không hợp lệ',
        data: null
      })
    }

    const updateData = { ...req.body }

    // Nếu đổi tên sản phẩm mà không truyền slug mới thì tự sinh slug
    if (updateData.productName && !updateData.slug) {
      updateData.slug = generateSlug(updateData.productName)
    }

    // Nếu có cập nhật categoryId thì check hợp lệ
    if (updateData.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(updateData.categoryId)) {
        return res.status(400).json({
          statusCode: 400,
          message: 'categoryId không hợp lệ',
          data: null
        })
      }
      const categoryExists = await Category.findById(updateData.categoryId)
      if (!categoryExists) {
        return res.status(404).json({
          statusCode: 404,
          message: 'Danh mục được chọn không tồn tại',
          data: null
        })
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('categoryId', 'categoryName slug')

    if (!updatedProduct) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy sản phẩm để cập nhật',
        data: null
      })
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    })
  } catch (error: any) {
    console.error(' Lỗi updateProduct:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * DELETE /api/v1/products/:id
 * Xóa sản phẩm
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'ID sản phẩm không hợp lệ',
        data: null
      })
    }

    const deletedProduct = await Product.findByIdAndDelete(id)

    if (!deletedProduct) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy sản phẩm để xóa',
        data: null
      })
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Xóa sản phẩm thành công',
      data: null
    })
  } catch (error: any) {
    console.error(' Lỗi deleteProduct:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}
