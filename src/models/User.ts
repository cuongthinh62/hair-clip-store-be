import { Schema, model, Document } from 'mongoose'

export interface IUser extends Document {
  username: string
  passwordHash: string
  fullName: string
  secretKey: string
  role: string
  createdAt?: Date
  updatedAt?: Date
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    secretKey: { type: String, required: true },
    role: { type: String, required: true, default: 'user' }
  },
  { timestamps: true }
)

export const User = model<IUser>('User', userSchema)
