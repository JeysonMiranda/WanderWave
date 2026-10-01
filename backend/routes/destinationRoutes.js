import express from 'express'
import {
  getDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
} from '../controllers/destinationController.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public read routes
router.get('/', getDestinations)
router.get('/:id', getDestinationById)

// Admin management routes
router.post('/', protect, adminOnly, createDestination)
router.put('/:id', protect, adminOnly, updateDestination)
router.delete('/:id', protect, adminOnly, deleteDestination)

export default router
