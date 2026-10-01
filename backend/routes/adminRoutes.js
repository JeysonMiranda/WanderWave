import express from 'express'
import {
  getAdminStats,
  getAdminUsers,
  updateUserByAdmin,
} from '../controllers/adminController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

// All admin routes require authentication and admin role
router.use(protect, adminOnly)

router.get('/stats', getAdminStats)
router.get('/users', getAdminUsers)
router.patch('/users/:id', updateUserByAdmin)

export default router
