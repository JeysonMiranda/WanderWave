import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destinationTitle: {
      type: String,
      required: true,
    },
    flightRoute: {
      type: String,
      required: true,
    },
    flightStatus: {
      type: String,
      default: 'Confirmed',
    },
    accommodation: {
      type: String,
      required: true,
    },
    accommodationDetails: {
      type: String,
      default: '',
    },
    bookingRef: {
      type: String,
      required: true,
    },
    checkInDate: {
      type: String,
      default: '',
    },
    assignedConcierge: {
      type: String,
      default: 'Marco Della Valle',
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled'],
      default: 'Active',
    },
    guests: {
      type: Number,
      default: 2,
    },
    totalPrice: {
      type: String,
      default: '',
    },
    specialRequests: {
      type: String,
      default: '',
    },
    addons: {
      type: [String],
      default: [],
    },
    flightClass: {
      type: String,
      default: 'Private Jet Charter',
    },
    durationNights: {
      type: Number,
      default: 7,
    },
    primaryVoyager: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
)

const Booking = mongoose.model('Booking', bookingSchema)
export default Booking
