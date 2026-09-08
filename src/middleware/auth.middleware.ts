import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: string
  }
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Bạn chưa đăng nhập hoặc Token không hợp lệ',
        data: null
      })
    }

    const token = authHeader.split(' ')[1]
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      throw new Error('Chưa cấu hình JWT_SECRET trong file .env')
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string; role: string }
    req.user = decoded

    next()
  } catch (error) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Token đã hết hạn hoặc không hợp lệ',
      data: null
    })
  }
}
