import Review from '../models/Review.js'
import Booking from '../models/Booking.js'
import Destination from '../models/Destination.js'

// @desc    Get approved reviews with optional filtering by targetType, targetId, or targetName
// @route   GET /api/reviews
// @access  Public
export const getApprovedReviews = async (req, res) => {
  try {
    const { targetType, targetId, targetName, limit = 20, sort = 'newest' } = req.query
    const query = { status: 'approved' }

    if (targetType && targetType.toLowerCase() !== 'all') {
      query.targetType = new RegExp(`^${targetType}$`, 'i')
    }

    if (targetId) {
      query.targetId = targetId
    } else if (targetName) {
      query.targetName = new RegExp(targetName.trim(), 'i')
    }

    let sortOption = { createdAt: -1 }
    if (sort === 'rating_high') sortOption = { rating: -1, createdAt: -1 }
    if (sort === 'rating_low') sortOption = { rating: 1, createdAt: -1 }

    const reviews = await Review.find(query)
      .sort(sortOption)
      .limit(parseInt(limit, 10) || 20)

    // Calculate rating statistics
    const allMatching = await Review.find(query)
    const totalCount = allMatching.length
    const avgRating =
      totalCount > 0
        ? (allMatching.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
        : '5.0'

    const distribution = {
      5: allMatching.filter((r) => r.rating === 5).length,
      4: allMatching.filter((r) => r.rating === 4).length,
      3: allMatching.filter((r) => r.rating === 3).length,
      2: allMatching.filter((r) => r.rating === 2).length,
      1: allMatching.filter((r) => r.rating === 1).length,
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      totalCount,
      avgRating: parseFloat(avgRating),
      distribution,
      data: reviews,
    })
  } catch (error) {
    console.error('[GetApprovedReviews Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews from database',
    })
  }
}

// @desc    Get current user's submitted reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    })
  } catch (error) {
    console.error('[GetMyReviews Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your reviews',
    })
  }
}

// @desc    Create a new review (Package, Hotel, Guide, Driver, Destination)
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      targetName,
      rating,
      subRatings,
      title,
      comment,
      bookingId,
    } = req.body

    if (!targetType || !targetName || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Target category, target name, star rating, and review comment are required.',
      })
    }

    const starRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5))

    let isVerified = false
    let linkedBooking = null

    if (bookingId) {
      const existingBooking = await Booking.findOne({
        _id: bookingId,
        user: req.user._id,
      })
      if (existingBooking) {
        isVerified = true
        linkedBooking = existingBooking._id
      }
    }

    const review = await Review.create({
      user: req.user._id,
      userName: req.user.name || 'Valued Voyager',
      userEmail: req.user.email,
      booking: linkedBooking,
      targetType,
      targetId: targetId || '',
      targetName: targetName.trim(),
      rating: starRating,
      subRatings: subRatings || {},
      title: title ? title.trim() : 'Exceptional Voyage',
      comment: comment.trim(),
      status: 'approved', // Auto-approved for realistic responsiveness, subject to admin moderation
      verifiedBooking: isVerified,
    })

    // If destination was reviewed, update destination average rating
    if (targetType.toLowerCase() === 'destination' && targetId) {
      try {
        const destReviews = await Review.find({
          targetType: 'Destination',
          targetId: targetId,
          status: 'approved',
        })
        if (destReviews.length > 0) {
          const newAvg = (
            destReviews.reduce((sum, r) => sum + r.rating, 0) / destReviews.length
          ).toFixed(2)
          await Destination.findByIdAndUpdate(targetId, {
            rating: parseFloat(newAvg),
            reviewsCount: destReviews.length,
          })
        }
      } catch (err) {
        console.warn('[Review Update Destination Rating Warn]:', err.message)
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your sovereign review has been published.',
      data: review,
    })
  } catch (error) {
    console.error('[CreateReview Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit review',
    })
  }
}

// @desc    Admin: Get all reviews with status filters & moderation metrics
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getAdminReviews = async (req, res) => {
  try {
    const { status, targetType, search } = req.query
    const query = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (targetType && targetType !== 'all') {
      query.targetType = new RegExp(`^${targetType}$`, 'i')
    }

    if (search && search.trim()) {
      const s = new RegExp(search.trim(), 'i')
      query.$or = [{ targetName: s }, { userName: s }, { title: s }, { comment: s }]
    }

    const reviews = await Review.find(query).sort({ createdAt: -1 })

    // Aggregates
    const all = await Review.find({})
    const totalCount = all.length
    const pendingCount = all.filter((r) => r.status === 'pending').length
    const approvedCount = all.filter((r) => r.status === 'approved').length
    const rejectedCount = all.filter((r) => r.status === 'rejected').length
    const avgRating =
      totalCount > 0 ? (all.reduce((s, r) => s + r.rating, 0) / totalCount).toFixed(2) : '5.0'

    res.status(200).json({
      success: true,
      count: reviews.length,
      metrics: {
        totalReviews: totalCount,
        pendingReviews: pendingCount,
        approvedReviews: approvedCount,
        rejectedReviews: rejectedCount,
        averageScore: parseFloat(avgRating),
      },
      data: reviews,
    })
  } catch (error) {
    console.error('[GetAdminReviews Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews for moderation',
    })
  }
}

// @desc    Admin: Moderate review status (approve, reject, or reset to pending)
// @route   PATCH /api/admin/reviews/:id/status
// @access  Private/Admin
export const moderateReview = async (req, res) => {
  try {
    const { status, moderationNote } = req.body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be pending, approved, or rejected',
      })
    }

    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      })
    }

    review.status = status
    if (moderationNote !== undefined) {
      review.moderationNote = moderationNote
    }

    await review.save()

    res.status(200).json({
      success: true,
      message: `Review status updated to ${status}`,
      data: review,
    })
  } catch (error) {
    console.error('[ModerateReview Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update review status',
    })
  }
}

// @desc    Admin or Author: Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      })
    }

    // Only Admin or author can delete
    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      })
    }

    await Review.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('[DeleteReview Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
    })
  }
}
