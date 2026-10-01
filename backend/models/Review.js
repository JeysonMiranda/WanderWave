import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    // Target Category: Destination | Hotel | Guide | Driver | Package
    targetType: {
      type: String,
      required: [true, 'Review target category is required'],
      enum: ['Destination', 'Hotel', 'Guide', 'Driver', 'Package'],
      default: 'Destination',
    },
    targetId: {
      type: String,
      default: '',
    },
    targetName: {
      type: String,
      required: [true, 'Target name is required'],
      trim: true,
    },
    // Overall Star Rating: 1 to 5
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    // Sub-ratings for multi-dimensional trip review
    subRatings: {
      hotelRating: { type: Number, min: 1, max: 5 },
      guideRating: { type: Number, min: 1, max: 5 },
      driverRating: { type: Number, min: 1, max: 5 },
      packageRating: { type: Number, min: 1, max: 5 },
    },
    title: {
      type: String,
      trim: true,
      default: 'Exceptional Experience',
    },
    comment: {
      type: String,
      required: [true, 'Review commentary is required'],
      trim: true,
    },
    // Moderation Status: pending | approved | rejected
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // Auto-approved by default for responsiveness, fully moderatable by Admin
    },
    moderationNote: {
      type: String,
      default: '',
    },
    verifiedBooking: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

const Review = mongoose.model('Review', reviewSchema)
export default Review
