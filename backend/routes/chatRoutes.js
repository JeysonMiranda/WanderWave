import express from 'express'
import { handleChatMessage } from '../controllers/chatController.js'

const router = express.Router()

// Route: POST /api/chat
router.post('/', handleChatMessage)

export default router
