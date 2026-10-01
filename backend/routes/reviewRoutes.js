import express from 'express'
import {
  getApprovedReviews,
  getMyReviews,
  createReview,
  deleteReview,
} from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public route to view approved reviews
router.get('/', getApprovedReviews)

// Private traveler routes
router.get('/my-reviews', protect, getMyReviews)
router.post('/', protect, createReview)
router.delete('/:id', protect, deleteReview)

export default router
