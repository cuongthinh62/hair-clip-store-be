import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  categoryId: mongoose.Types.ObjectId
  productName: string
  slug: string
  material: string
  description: string
  wholesalePrice: number
  price: number
  discountPrice: number
  stockQuantity: number
  color: string
  occasion: string
  imageUrl: string
  soldQuantity: number
  bestSeller: boolean
  isFeatured: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductSchema: Schema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    material: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    wholesalePrice: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: true,
      default: 0
    },
    discountPrice: {
      type: Number,
      default: 0
    },
    stockQuantity: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: ''
    },
    occasion: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    soldQuantity: {
      type: Number,
      default: 0
    },
    bestSeller: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // Tự động quản lý 2 trường createdAt và updatedAt
  }
)

export const Product = mongoose.model<IProduct>('Product', ProductSchema)
