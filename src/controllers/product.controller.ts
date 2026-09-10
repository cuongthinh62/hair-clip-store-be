import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Product } from '../models/Product'

interface GetProductsQuery {
  page?: string
  limit?: string
  search?: string
  categoryId?: string
  categorySlug?: string
  color?: string
  isFeatured?: string
  bestSeller?: string
  isActive?: string
  sortBy?: 'createdAt' | 'price' | 'soldQuantity'
  sortOrder?: 'asc' | 'desc'
}

const ALLOWED_SORT_FIELDS = ['createdAt', 'price', 'soldQuantity']

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
 */
export const getProducts = async (req: Request<{}, {}, {}, GetProductsQuery>, res: Response) => {
  try {
    const { search, categoryId, color, isFeatured, bestSeller, isActive, sortBy, sortOrder } = req.query

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    // Hỗ trợ nhận cả limit lẫn pageSize từ Frontend
    const limitParam = req.query.limit || (req.query as any).pageSize
    const limit = Math.max(1, parseInt(limitParam as string, 10) || 10)
    const skip = (page - 1) * limit

    const filter: Record<string, any> = {}

    if (isActive === 'true') filter.isActive = true
    if (isActive === 'false') filter.isActive = false

    if (search && search.trim() !== '') {
      filter.productName = { $regex: search.trim(), $options: 'i' }
    }

    // XỬ LÝ LỖI CATEGORY ID (Convert sang ObjectId nếu hợp lệ)
    if (categoryId && categoryId.trim() !== '') {
      const trimmedId = categoryId.trim()
      const conditions: any[] = [{ categoryId: trimmedId }, { 'categoryId.$oid': trimmedId }]

      if (mongoose.Types.ObjectId.isValid(trimmedId)) {
        conditions.push({ categoryId: new mongoose.Types.ObjectId(trimmedId) })
      }

      filter.$or = conditions
    }

    if (color) filter.color = color
    if (isFeatured === 'true') filter.isFeatured = true
    if (isFeatured === 'false') filter.isFeatured = false
    if (bestSeller === 'true') filter.bestSeller = true
    if (bestSeller === 'false') filter.bestSeller = false

    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy as string) ? (sortBy as string) : 'createdAt'
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection }

    const [rawItems, totalItems] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter)
    ])

    const items = rawItems.map((prod: any) => {
      const cleanCategoryId =
        typeof prod.categoryId === 'object' && prod.categoryId?.$oid
          ? prod.categoryId.$oid
          : prod.categoryId?.toString() || prod.categoryId

      return {
        ...prod,
        categoryId: cleanCategoryId
      }
    })

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
  } catch (error: any) {
    console.error('Lỗi getProducts:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * GET /api/v1/products/:id
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const product: any = await Product.findById(id).lean()

    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy sản phẩm',
        data: null
      })
    }

    if (typeof product.categoryId === 'object' && product.categoryId?.$oid) {
      product.categoryId = product.categoryId.$oid
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: product
    })
  } catch (error: any) {
    console.error('Lỗi getProductById:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * GET /api/v1/products/slug/:slug
 */
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params

    const product: any = await Product.findOne({ slug }).lean()

    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy sản phẩm',
        data: null
      })
    }

    if (typeof product.categoryId === 'object' && product.categoryId?.$oid) {
      product.categoryId = product.categoryId.$oid
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: product
    })
  } catch (error: any) {
    console.error('Lỗi getProductBySlug:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * POST /api/v1/products
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

    if (!productName || !categoryId || price === undefined) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Tên sản phẩm (productName), danh mục (categoryId) và giá (price) là bắt buộc',
        data: null
      })
    }

    const slug = req.body.slug || generateSlug(productName)

    const existingSlug = await Product.findOne({ slug })
    if (existingSlug) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Slug sản phẩm đã tồn tại',
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
    console.error('Lỗi createProduct:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * PUT /api/v1/products/:id
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const updateData = { ...req.body }

    if (updateData.productName && !updateData.slug) {
      updateData.slug = generateSlug(updateData.productName)
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })

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
    console.error('Lỗi updateProduct:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}

/**
 * DELETE /api/v1/products/:id
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

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
    console.error('Lỗi deleteProduct:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      data: null
    })
  }
}
