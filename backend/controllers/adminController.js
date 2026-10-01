import User from '../models/User.js'
import Booking from '../models/Booking.js'
import Destination from '../models/Destination.js'

// @desc    Get dashboard metrics & overview stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalDestinations, totalBookings, activeBookings] =
      await Promise.all([
        User.countDocuments(),
        Destination.countDocuments(),
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'Active' }),
      ])

    const recentBookings = await Booking.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDestinations,
        totalBookings,
        activeBookings,
        estimatedRevenue: `$${(totalBookings * 3450).toLocaleString()}`,
        recentBookings,
      },
    })
  } catch (error) {
    console.error('[GetAdminStats Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative statistics',
    })
  }
}

// @desc    Get all registered users / travelers
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    })
  } catch (error) {
    console.error('[GetAdminUsers Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users directory',
    })
  }
}

// @desc    Update user role or membership tier
// @route   PATCH /api/admin/users/:id
// @access  Private/Admin
export const updateUserByAdmin = async (req, res) => {
  try {
    const { role, membershipTier } = req.body

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if (role) user.role = role
    if (membershipTier) user.membershipTier = membershipTier

    await user.save()

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipTier: user.membershipTier,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[UpdateUserByAdmin Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    })
  }
}
