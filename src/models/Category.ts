import { Schema, model, Document } from 'mongoose'

export interface ICategory extends Document {
  categoryName: string
  slug: string
  description?: string
  isActive: boolean
  imgUrl?: string
  createdAt?: Date
  updatedAt?: Date
}

const categorySchema = new Schema<ICategory>(
  {
    categoryName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    imgUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

export const Category = model<ICategory>('Category', categorySchema)
