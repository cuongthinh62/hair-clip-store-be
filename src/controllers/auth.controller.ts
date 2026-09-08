import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'
import { signAccessToken } from '../utils/jwt'

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, secretKey } = req.body

    // 1. Kiểm tra đầu vào có đủ username, password và secretKey không
    if (!username || !password || !secretKey) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ username, password và secretKey'
      })
    }

    // 2. Tìm user theo username
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' })
    }

    // 3. Kiểm tra secretKey truyền lên có khớp với DB không
    const isMatchSecretKey = await bcrypt.compare(secretKey, user.secretKey)
    if (!isMatchSecretKey) {
      return res.status(400).json({ message: 'SecretKey không chính xác' })
    }

    // 4. So sánh mật khẩu truyền lên với passwordHash trong DB
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' })
    }

    // 5. Ký JWT Token khi thông tin hợp lệ
    const accessToken = signAccessToken({
      id: user._id.toString(),
      role: user.role
    })

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    })
  } catch (error: any) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message || error })
  }
}

export const logout = async (_req: Request, res: Response) => {
  return res.status(200).json({ message: 'Đăng xuất thành công' })
}
