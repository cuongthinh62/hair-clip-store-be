import jwt, { SignOptions } from 'jsonwebtoken'
import type { StringValue } from 'ms'

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key'
// Ép kiểu về StringValue để tương thích hoàn toàn với SignOptions['expiresIn']
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as StringValue

// jwt.ts
export interface ITokenPayload {
  id: string // Đã đổi từ userId sang id
  role: string
  [key: string]: any
}

/**
 * Tạo mới một accessToken
 */
export const signAccessToken = (payload: ITokenPayload, options?: SignOptions): string => {
  const signOptions: SignOptions = {
    expiresIn: EXPIRES_IN,
    ...options
  }

  return jwt.sign(payload, JWT_SECRET, signOptions)
}

/**
 * Giải mã và xác thực accessToken
 */
export const verifyAccessToken = (token: string): ITokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ITokenPayload
    return decoded
  } catch (error) {
    return null
  }
}
