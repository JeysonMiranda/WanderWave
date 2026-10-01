import mongoose from 'mongoose'

const destinationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Destination title is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    region: {
      type: String,
      default: 'Mediterranean',
      trim: true,
    },
    travelType: {
      type: String,
      default: 'Luxury',
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    gallery: {
      type: [String],
      default: [],
    },
    price: {
      type: String,
      required: [true, 'Price label is required'],
    },
    budgetNumeric: {
      type: Number,
      default: 3500,
    },
    estimatedBudget: {
      tier: { type: String, default: 'Ultra-Luxury' },
      avgNightly: { type: String, default: '$950 - $1,800' },
      flightEst: { type: String, default: '$1,200 - $3,500' },
      activitiesEst: { type: String, default: '$800 - $2,000' },
      recommendedTotal: { type: String, default: '$3,500 - $6,500' },
      notes: { type: String, default: 'All transfers, private concierge & bespoke excursions included.' },
    },
    tag: {
      type: String,
      default: 'Featured',
    },
    description: {
      type: String,
      default: '',
    },
    bestTimeToVisit: {
      type: String,
      default: 'Year-Round Luxury',
    },
    popularAttractions: {
      type: [String],
      default: [],
    },
    thingsToDo: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.95,
    },
    reviewsCount: {
      type: Number,
      default: 48,
    },
  },
  {
    timestamps: true,
  }
)

const Destination = mongoose.model('Destination', destinationSchema)
export default Destination
