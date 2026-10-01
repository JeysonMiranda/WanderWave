import express from 'express'
import {
  getMyBookings,
  createBooking,
  cancelMyBooking,
  getAllBookings,
  updateBookingStatus,
} from '../controllers/bookingController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require JWT authentication
router.use(protect)

// Traveler routes
router.get('/my-bookings', getMyBookings)
router.post('/', createBooking)
router.patch('/:id/cancel', cancelMyBooking)

// Admin-only management routes
router.get('/all', adminOnly, getAllBookings)
router.patch('/:id/status', adminOnly, updateBookingStatus)

export default router
