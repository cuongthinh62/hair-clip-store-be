import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Category } from '../models/Category'
import { Product } from '../models/Product'

// ================== TYPES & CONSTANTS ==================
interface GetProductsByCategoryQuery {
  page?: string
  limit?: string
  sortBy?: 'createdAt' | 'price' | 'soldQuantity'
  sortOrder?: 'asc' | 'desc'
}

const ALLOWED_SORT_FIELDS = ['createdAt', 'price', 'soldQuantity']

// Danh sách các trường hợp lệ được phép truyền vào Body của Category
const ALLOWED_CATEGORY_FIELDS = ['categoryName', 'slug', 'description', 'imgUrl', 'isActive']

// Hàm helper tự động tạo slug từ tên danh mục
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
 * GET /api/v1/categories/:id
 * Lấy chi tiết 1 danh mục theo ID
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'ID danh mục không hợp lệ',
        data: null
      })
    }

    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy danh mục',
        data: null
      })
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Lấy thông tin danh mục thành công',
      data: category
    })
  } catch (error) {
    console.error('Lỗi getCategoryById:', error)
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'ID danh mục không hợp lệ',
        data: null
      })
    }

    const category = await Category.findOne({ _id: id, isActive: true })
    if (!category) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy danh mục',
        data: null
      })
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    const skip = (page - 1) * limit

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

/**
 * POST /api/v1/categories
 * Tạo mới danh mục
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    // Kiểm tra trường dư thừa / không hợp lệ
    const invalidFields = Object.keys(req.body).filter((key) => !ALLOWED_CATEGORY_FIELDS.includes(key))
    if (invalidFields.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: `Trường dữ liệu không hợp lệ: ${invalidFields.join(', ')}`,
        data: null
      })
    }

    const { categoryName, description, imgUrl, isActive } = req.body

    if (!categoryName) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Tên danh mục (categoryName) là bắt buộc',
        data: null
      })
    }

    const slug = req.body.slug || generateSlug(categoryName)

    const newCategory = await Category.create({
      categoryName,
      slug,
      description: description || '',
      imgUrl: imgUrl || '',
      isActive: isActive !== undefined ? isActive : true
    })

    return res.status(201).json({
      statusCode: 201,
      message: 'Tạo danh mục thành công',
      data: newCategory
    })
  } catch (error: any) {
    console.error('Lỗi createCategory:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      error: error.message
    })
  }
}

/**
 * PUT /api/v1/categories/:id
 * Cập nhật thông tin danh mục
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'ID danh mục không hợp lệ',
        data: null
      })
    }

    // Kiểm tra trường dư thừa / không hợp lệ
    const invalidFields = Object.keys(req.body).filter((key) => !ALLOWED_CATEGORY_FIELDS.includes(key))
    if (invalidFields.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: `Trường dữ liệu không hợp lệ: ${invalidFields.join(', ')}`,
        data: null
      })
    }

    const { categoryName, slug, description, imgUrl, isActive } = req.body

    const updateData: any = {}
    if (categoryName !== undefined) {
      updateData.categoryName = categoryName
      updateData.slug = slug || generateSlug(categoryName)
    } else if (slug !== undefined) {
      updateData.slug = slug
    }

    if (description !== undefined) updateData.description = description
    if (imgUrl !== undefined) updateData.imgUrl = imgUrl
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true })

    if (!updatedCategory) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy danh mục để cập nhật',
        data: null
      })
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Cập nhật danh mục thành công',
      data: updatedCategory
    })
  } catch (error: any) {
    console.error('Lỗi updateCategory:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      error: error.message
    })
  }
}

/**
 * DELETE /api/v1/categories/:id
 * Xóa danh mục và các sản phẩm liên quan (Xóa cứng)
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    console.log('=== DEBUG DELETE CATEGORY ===')
    console.log('1. ID nhận từ params:', id)
    console.log('2. ID hợp lệ không?:', mongoose.Types.ObjectId.isValid(id as string))

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'ID danh mục không hợp lệ',
        data: null
      })
    }

    const objectId = new mongoose.Types.ObjectId(id)
    const deleteFilter = {
      $or: [{ categoryId: objectId }, { categoryId: id }, { 'categoryId.$oid': id }]
    }

    console.log('3. Bộ lọc xóa sản phẩm (deleteFilter):', JSON.stringify(deleteFilter, null, 2))

    // Kiểm tra trước xem có bao nhiêu sản phẩm khớp với bộ lọc này trong DB
    const matchingProductsCount = await Product.countDocuments(deleteFilter)
    console.log('4. Số lượng sản phẩm tìm thấy khớp với filter:', matchingProductsCount)

    const productDeleteResult = await Product.deleteMany(deleteFilter)
    const legacyProductDeleteResult = await Product.collection.deleteMany(deleteFilter)

    const deletedProductCount = productDeleteResult.deletedCount + legacyProductDeleteResult.deletedCount
    console.log('5. Kết quả xóa sản phẩm thực tế:', {
      deletedProductCount,
      mgnDeleteCount: productDeleteResult.deletedCount,
      nativeDeleteCount: legacyProductDeleteResult.deletedCount
    })

    const deletedCategory = await Category.findByIdAndDelete(id)
    console.log(
      '6. Trạng thái xóa Category:',
      deletedCategory ? 'Đã xóa thành công' : 'Không tìm thấy category để xóa (hoặc đã bị xóa trước đó)'
    )

    return res.status(200).json({
      statusCode: 200,
      message: `Xóa danh mục và ${deletedProductCount} sản phẩm liên quan thành công`,
      data: null
    })
  } catch (error: any) {
    console.error('Lỗi deleteCategory:', error)
    return res.status(500).json({
      statusCode: 500,
      message: 'Lỗi server, vui lòng thử lại sau',
      error: error.message
    })
  }
}
