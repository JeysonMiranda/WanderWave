import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'

// Helper: Sign JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, membershipTier } = req.body

    // Check mandatory fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      })
    }

    // Check existing email
    const userExists = await User.findOne({ email: email.toLowerCase() })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      })
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      membershipTier: membershipTier || 'Platinum Elite',
    })

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipTier: user.membershipTier,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('[Register Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    })
  }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      })
    }

    // Check user exists with password field explicitly selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Verify password match
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipTier: user.membershipTier,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[Login Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during authentication',
    })
  }
}

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private (Protected by JWT)
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    })
  } catch (error) {
    console.error('[GetMe Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile',
    })
  }
}

// @desc    Request password recovery
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your account email address',
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No WanderWave account found with that email address.',
      })
    }

    // Generate reset token and set expiry on user
    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`

    console.log(`\n========================================`)
    console.log(`[PASSWORD RECOVERY REQUEST]`)
    console.log(`User: ${user.name} (${user.email})`)
    console.log(`Token: ${resetToken}`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log(`========================================\n`)

    res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetToken,
      resetUrl,
      user: {
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('[ForgotPassword Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing password recovery',
    })
  }
}

// @desc    Verify reset token validity
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid.',
      user: {
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('[VerifyResetToken Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Error verifying reset token',
    })
  }
}

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      })
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password')

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      })
    }

    // Set new password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    // Generate fresh JWT token
    const jwtToken = generateToken(user._id)

    res.status(200).json({
      success: true,
      message: 'Password updated successfully! Welcome back.',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipTier: user.membershipTier,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[ResetPassword Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting password',
    })
  }
}
