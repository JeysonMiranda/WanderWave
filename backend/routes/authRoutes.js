import express from 'express'
import {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public authentication & recovery routes
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/forgot-password', forgotPassword)
router.get('/verify-reset-token/:token', verifyResetToken)
router.post('/reset-password/:token', resetPassword)

// Protected route (requires valid JWT token)
router.get('/me', protect, getMe)

export default router
