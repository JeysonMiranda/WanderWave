import Booking from '../models/Booking.js'

// @desc    Get logged in user's bookings (auto-creates sample booking if none exists)
// @route   GET /api/bookings/my-bookings
// @access  Private (JWT)
export const getMyBookings = async (req, res) => {
  try {
    let bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 })

    // If user has no booking yet, seed a default luxury itinerary for their profile
    if (bookings.length === 0) {
      const defaultBooking = await Booking.create({
        user: req.user._id,
        destinationTitle: 'Amalfi Coast & Capri, Italy',
        flightRoute: 'Rome (FCO) → Naples (NAP)',
        flightStatus: 'Confirmed',
        accommodation: 'Villa TreVille Positano',
        accommodationDetails: 'Cliffside Deluxe Suite • 6 Nights',
        bookingRef: `WW-${Math.floor(10000 + Math.random() * 90000)}A`,
        checkInDate: 'Oct 12, 2026',
        assignedConcierge: 'Marco Della Valle',
        status: 'Active',
      })
      bookings = [defaultBooking]
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    })
  } catch (error) {
    console.error('[GetMyBookings Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve traveler bookings from database',
    })
  }
}

// @desc    Create a new booking for authenticated user
// @route   POST /api/bookings
// @access  Private (JWT)
export const createBooking = async (req, res) => {
  try {
    const {
      destinationTitle,
      flightRoute,
      accommodation,
      accommodationDetails,
      checkInDate,
      guests,
      totalPrice,
      specialRequests,
      addons,
      flightClass,
      durationNights,
      primaryVoyager,
    } = req.body

    if (!destinationTitle || !flightRoute || !accommodation) {
      return res.status(400).json({
        success: false,
        message: 'Destination, flight route, and accommodation are required',
      })
    }

    const booking = await Booking.create({
      user: req.user._id,
      destinationTitle,
      flightRoute,
      flightStatus: 'Confirmed',
      accommodation,
      accommodationDetails: accommodationDetails || '',
      bookingRef: `WW-${Math.floor(10000 + Math.random() * 90000)}A`,
      checkInDate: checkInDate || 'Flexible 2026',
      assignedConcierge: 'Marco Della Valle',
      status: 'Active',
      guests: guests || 2,
      totalPrice: totalPrice || '',
      specialRequests: specialRequests || '',
      addons: addons || [],
      flightClass: flightClass || 'Private Jet Charter',
      durationNights: durationNights || 7,
      primaryVoyager: primaryVoyager || {
        name: req.user.name || '',
        email: req.user.email || '',
        phone: '',
      },
    })

    res.status(201).json({
      success: true,
      message: 'Booking created successfully in database',
      data: booking,
    })
  } catch (error) {
    console.error('[CreateBooking Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create booking in database',
    })
  }
}

// @desc    Get all bookings across all travelers
// @route   GET /api/bookings/all
// @access  Private/Admin
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user', 'name email membershipTier role')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    })
  } catch (error) {
    console.error('[GetAllBookings Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve all bookings',
    })
  }
}

// @desc    Update booking status (Confirm, Complete, Cancel)
// @route   PATCH /api/bookings/:id/status
// @access  Private/Admin
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, flightStatus } = req.body

    const booking = await Booking.findById(req.params.id)
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      })
    }

    if (status) booking.status = status
    if (flightStatus) booking.flightStatus = flightStatus

    await booking.save()

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    })
  } catch (error) {
    console.error('[UpdateBookingStatus Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update booking status',
    })
  }
}

// @desc    Cancel user's own booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (JWT)
export const cancelMyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized',
      })
    }

    booking.status = 'Cancelled'
    booking.flightStatus = 'Cancelled'
    await booking.save()

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully in database',
      data: booking,
    })
  } catch (error) {
    console.error('[CancelMyBooking Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
    })
  }
}
