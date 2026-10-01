import { processChatMessage } from '../services/aiChatService.js'

// @desc    Process chat message with AI Concierge
// @route   POST /api/chat
// @access  Public
export const handleChatMessage = async (req, res) => {
  try {
    const { message, conversationHistory = [], language = 'en' } = req.body

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A message string is required',
      })
    }

    const aiResponse = await processChatMessage({
      message: message.trim(),
      conversationHistory,
      language,
    })

    res.status(200).json(aiResponse)
  } catch (error) {
    console.error('[ChatController Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing chat request',
    })
  }
}
