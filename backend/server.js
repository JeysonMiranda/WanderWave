import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db.js'
import { seedInitialData } from './config/seedData.js'
import authRoutes from './routes/authRoutes.js'
import destinationRoutes from './routes/destinationRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import chatRoutes from './routes/chatRoutes.js'

// Load environment variables
dotenv.config()

// Connect to MongoDB Database and seed initial data
connectDB().then(() => {
  seedInitialData()
})

const app = express()

// Cross-Origin Resource Sharing (CORS) setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('CORS policy: Not allowed by CORS'))
    },
    credentials: true,
  })
)

// Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Root API info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    name: 'WanderWave Journeys REST API',
    version: '1.0.0',
    message: 'Backend API server is running smoothly and connected to MongoDB',
    frontendUrl: 'http://localhost:5173',
    endpoints: {
      health: 'GET /api/health',
      destinations: 'GET /api/destinations',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      userProfile: 'GET /api/auth/me (Protected)',
      bookings: 'GET /api/bookings/my-bookings (Protected)',
      chat: 'POST /api/chat',
    },
  })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'WanderWave API server is operating normally',
    timestamp: new Date().toISOString(),
  })
})

// Route mounts
app.use('/api/auth', authRoutes)
app.use('/api/destinations', destinationRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/chat', chatRoutes)

// 404 Not Found fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`,
  })
})

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`[Server] WanderWave API running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`)
})

export default server
