import Destination from '../models/Destination.js'

// @desc    Get all destinations with optional search and filters
// @route   GET /api/destinations
// @access  Public
export const getDestinations = async (req, res) => {
  try {
    const { search, country, region, travelType, maxBudget, sort } = req.query
    const query = {}

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      query.$or = [
        { title: searchRegex },
        { country: searchRegex },
        { region: searchRegex },
        { description: searchRegex },
        { popularAttractions: searchRegex },
        { thingsToDo: searchRegex },
      ]
    }

    if (country && country.toLowerCase() !== 'all') {
      query.country = new RegExp(`^${country}$`, 'i')
    }

    if (region && region.toLowerCase() !== 'all') {
      query.region = new RegExp(`^${region}$`, 'i')
    }

    if (travelType && travelType.toLowerCase() !== 'all') {
      query.$or = [
        { travelType: new RegExp(`^${travelType}$`, 'i') },
        { tag: new RegExp(`^${travelType}$`, 'i') },
      ]
    }

    if (maxBudget) {
      const budgetLimit = Number(maxBudget)
      if (!isNaN(budgetLimit) && budgetLimit > 0) {
        query.budgetNumeric = { $lte: budgetLimit }
      }
    }

    let sortOption = { createdAt: -1 }
    if (sort === 'price_asc') {
      sortOption = { budgetNumeric: 1 }
    } else if (sort === 'price_desc') {
      sortOption = { budgetNumeric: -1 }
    } else if (sort === 'rating_desc') {
      sortOption = { rating: -1 }
    } else if (sort === 'title_asc') {
      sortOption = { title: 1 }
    }

    const destinations = await Destination.find(query).sort(sortOption)
    res.status(200).json({
      success: true,
      count: destinations.length,
      data: destinations,
    })
  } catch (error) {
    console.error('[GetDestinations Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve travel destinations from database',
    })
  }
}

// @desc    Get single destination by ID
// @route   GET /api/destinations/:id
// @access  Public
export const getDestinationById = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id)
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      })
    }
    res.status(200).json({
      success: true,
      data: destination,
    })
  } catch (error) {
    console.error('[GetDestinationById Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve destination details',
    })
  }
}

// @desc    Create a new travel destination
// @route   POST /api/destinations
// @access  Private/Admin
export const createDestination = async (req, res) => {
  try {
    const {
      title,
      country,
      region,
      travelType,
      image,
      gallery,
      price,
      budgetNumeric,
      estimatedBudget,
      tag,
      description,
      bestTimeToVisit,
      popularAttractions,
      thingsToDo,
      rating,
      reviewsCount,
    } = req.body

    if (!title || !country || !image || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, country, image URL, and price are required',
      })
    }

    const numericPrice = budgetNumeric || parseInt(price.replace(/\D/g, ''), 10) || 3500

    const destination = await Destination.create({
      title,
      country,
      region: region || 'Mediterranean',
      travelType: travelType || tag || 'Luxury',
      image,
      gallery: Array.isArray(gallery) && gallery.length > 0 ? gallery : [image],
      price,
      budgetNumeric: numericPrice,
      estimatedBudget: estimatedBudget || {
        tier: 'Ultra-Luxury',
        avgNightly: '$950 - $1,800',
        flightEst: '$1,200 - $3,500',
        activitiesEst: '$800 - $2,000',
        recommendedTotal: price,
        notes: 'All transfers, private concierge & bespoke excursions included.',
      },
      tag: tag || 'Featured',
      description: description || '',
      bestTimeToVisit: bestTimeToVisit || 'May to October (Sailing Season)',
      popularAttractions: Array.isArray(popularAttractions) ? popularAttractions : [],
      thingsToDo: Array.isArray(thingsToDo) ? thingsToDo : [],
      rating: rating || 4.95,
      reviewsCount: reviewsCount || 48,
    })

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: destination,
    })
  } catch (error) {
    console.error('[CreateDestination Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create destination in database',
    })
  }
}

// @desc    Update an existing destination
// @route   PUT /api/destinations/:id
// @access  Private/Admin
export const updateDestination = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id)

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      })
    }

    const updatedDestination = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      message: 'Destination updated successfully',
      data: updatedDestination,
    })
  } catch (error) {
    console.error('[UpdateDestination Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update destination',
    })
  }
}

// @desc    Delete a destination
// @route   DELETE /api/destinations/:id
// @access  Private/Admin
export const deleteDestination = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id)

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      })
    }

    await Destination.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Destination deleted successfully from database',
    })
  } catch (error) {
    console.error('[DeleteDestination Error]:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete destination',
    })
  }
}
