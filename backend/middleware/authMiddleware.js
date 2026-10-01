import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Protect middleware: verifies JWT Bearer token
export const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Fetch user from decoded id (exclude password)
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists with this authorization token',
        })
      }

      return next()
    } catch (error) {
      console.error('[AuthMiddleware] Token verification failed:', error.message)
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token',
      })
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authorization token provided',
    })
  }
}

// Admin only middleware: checks if authenticated user has role === 'admin'
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privileges required',
  })
}
