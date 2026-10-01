import Destination from '../models/Destination.js'
import User from '../models/User.js'
import Booking from '../models/Booking.js'

export const seedInitialData = async () => {
  try {
    // 1. Rich Destinations Catalog
    const richDestinations = [
      {
        title: 'Amalfi Coast & Capri',
        country: 'Italy',
        region: 'Mediterranean',
        travelType: 'Romantic',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 'From $3,450',
        budgetNumeric: 3450,
        estimatedBudget: {
          tier: 'Ultra-Luxury',
          avgNightly: '$1,200 – $2,400',
          flightEst: '$1,400 – $3,200',
          activitiesEst: '$1,500 – $3,000',
          recommendedTotal: '$3,450 – $7,800',
          notes: 'Includes private catamaran charter, cliffside suite, and dedicated chauffeur.',
        },
        tag: 'Featured',
        description: 'Cliffside private villas, private catamaran sailings, and Mediterranean Michelin dining.',
        bestTimeToVisit: 'May – October (Mediterranean summer, calm sailing & warm sea breezes)',
        popularAttractions: [
          'Positano Cliffside & Marina Grande',
          'Blue Grotto (Grotta Azzurra) Sea Cave',
          'Villa Cimbrone & Ravello Infinity Terrace',
          'Capri Faraglioni Sea Stacks',
        ],
        thingsToDo: [
          'Private Riva Aquarama speedboat charter around Capri and the Faraglioni',
          'Sunset aperitivo on a cliffside private balcony in Ravello',
          'Helicopter transfer from Naples FBO directly to private cliffside helipad',
          'Exclusive limoncello and Michelin-starred tasting at Villa TreVille',
        ],
        rating: 4.98,
        reviewsCount: 142,
      },
      {
        title: 'Kyoto Imperial Gardens',
        country: 'Japan',
        region: 'East Asia',
        travelType: 'Cultural',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 'From $2,890',
        budgetNumeric: 2890,
        estimatedBudget: {
          tier: 'Imperial Cultural',
          avgNightly: '$850 – $1,600',
          flightEst: '$1,800 – $4,000',
          activitiesEst: '$900 – $1,800',
          recommendedTotal: '$2,890 – $6,200',
          notes: 'Covers luxury onsen ryokan, master tea master session, and private transport.',
        },
        tag: 'Cultural',
        description: 'Private tea ceremonies, historical ryokans, and tranquil bamboo groves.',
        bestTimeToVisit: 'March – May (Cherry Blossoms) & October – November (Autumn foliage)',
        popularAttractions: [
          'Fushimi Inari-taisha Torii Shrine',
          'Arashiyama Bamboo Grove & Moon Bridge',
          'Kinkaku-ji (Golden Pavilion)',
          'Gion Historic Geisha District',
        ],
        thingsToDo: [
          'Private zen master tea ceremony in a 400-year-old sanctuary',
          'Exclusive after-hours illumination walk through Arashiyama bamboo forest',
          'Private Kaiseki dining prepared by master chef in an authentic Sukiya ryokan',
          'Private bullet train Gran Class luxury escort from Tokyo',
        ],
        rating: 4.96,
        reviewsCount: 98,
      },
      {
        title: 'Bora Bora Overwater Villas',
        country: 'French Polynesia',
        region: 'South Pacific',
        travelType: 'Beach & Coastal',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 'From $4,200',
        budgetNumeric: 4200,
        estimatedBudget: {
          tier: 'Sovereign Island',
          avgNightly: '$1,600 – $3,200',
          flightEst: '$2,200 – $5,500',
          activitiesEst: '$1,200 – $2,800',
          recommendedTotal: '$4,200 – $9,800',
          notes: 'Includes overwater villa with private plunge pool and inter-island sea flights.',
        },
        tag: 'Luxury',
        description: 'Turquoise lagoons, private plunge pools, and bespoke helicopter tours.',
        bestTimeToVisit: 'May – October (Dry season, crystal-clear lagoon visibility & gentle trade winds)',
        popularAttractions: [
          'Mount Otemanu Volcano Pinnacle',
          'Matira Beach White Coral Sands',
          'Bora Bora Lagoonarium & Coral Gardens',
          'Tupitipiti Point Deep Dive Reef',
        ],
        thingsToDo: [
          'Private outrigger canoe breakfast delivered to your overwater glass-floor deck',
          'Helicopter flight directly over Mount Otemanu and the heart-shaped atoll of Tupai',
          'Private lagoon safari with stingrays and harmless blacktip reef sharks',
          'Deep ocean Polynesian pearl diving masterclass',
        ],
        rating: 4.99,
        reviewsCount: 164,
      },
      {
        title: 'Swiss Alpine Expeditions',
        country: 'Switzerland',
        region: 'Alps & Central Europe',
        travelType: 'Alpine & Adventure',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 'From $3,120',
        budgetNumeric: 3120,
        estimatedBudget: {
          tier: 'Executive Alpine',
          avgNightly: '$1,100 – $2,200',
          flightEst: '$1,200 – $2,800',
          activitiesEst: '$1,100 – $2,400',
          recommendedTotal: '$3,120 – $6,900',
          notes: 'Includes luxury ski chalet, private mountain guide, and first-class rail passes.',
        },
        tag: 'Adventure',
        description: 'Glacier excursions, scenic mountain train journeys, and luxury chalet stays.',
        bestTimeToVisit: 'December – April (Ski & Snow) & July – September (High alpine hiking)',
        popularAttractions: [
          'The Matterhorn & Gornergrat Ridge',
          'Jungfraujoch - Top of Europe Glacier',
          'Lake Geneva & Lavaux Vineyards',
          'St. Moritz Frozen Lake & Corviglia',
        ],
        thingsToDo: [
          'Heliskiing onto untouched virgin powder glacier slopes',
          'Private panoramic Glacier Express Excellence Class compartment with caviar service',
          'High-alpine fondue dinner inside a secluded mountain igloo sanctuary',
          'Thermal spa sanctuary relaxation overlooking snow-capped 4,000m peaks',
        ],
        rating: 4.94,
        reviewsCount: 86,
      },
      {
        title: 'Santorini Caldera Suites',
        country: 'Greece',
        region: 'Mediterranean',
        travelType: 'Romantic',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 'From $3,650',
        budgetNumeric: 3650,
        estimatedBudget: {
          tier: 'Ultra-Luxury',
          avgNightly: '$1,300 – $2,600',
          flightEst: '$1,200 – $3,100',
          activitiesEst: '$1,200 – $2,500',
          recommendedTotal: '$3,650 – $7,900',
          notes: 'Includes infinity caldera pool suite, catamaran cruise, and VIP airport transfers.',
        },
        tag: 'Romantic',
        description: 'Sunset infinity pools, private yacht charters, and Cycladic luxury.',
        bestTimeToVisit: 'April – October (Long sunny days, warm Aegean waters, vibrant sunsets)',
        popularAttractions: [
          'Oia Sunset Caldera Cliffs & Blue Domes',
          'Akrotiri Minoan Bronze Age Ruins',
          'Red Beach & White Beach Volcanic Coves',
          'Amoudi Bay Seafood Pier',
        ],
        thingsToDo: [
          'Private catamaran sunset sail with volcanic hot springs swim and BBQ',
          'Private volcanic wine cellar degustation of crisp Assyrtiko wines',
          'Helicopter hop over the Nea Kameni volcanic crater',
          'Candlelit cliffside dining perched 300 meters above the Aegean',
        ],
        rating: 4.97,
        reviewsCount: 189,
      },
      {
        title: 'Sigiriya & Tea Country Heritage',
        country: 'Sri Lanka',
        region: 'South Asia',
        travelType: 'Heritage',
        image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 'From $2,450',
        budgetNumeric: 2450,
        estimatedBudget: {
          tier: 'Heritage Luxury',
          avgNightly: '$650 – $1,300',
          flightEst: '$1,100 – $2,500',
          activitiesEst: '$700 – $1,500',
          recommendedTotal: '$2,450 – $5,200',
          notes: 'Includes colonial heritage bungalow stays, personal chauffeur guide, and safari passes.',
        },
        tag: 'Heritage',
        description: 'Historic fortress view villas, private high-tea trails, and wildlife safaris.',
        bestTimeToVisit: 'December – April & July – September (Dry conditions, pristine hill country mist)',
        popularAttractions: [
          'Sigiriya Lion Rock Fortress Sky Palace',
          'Dambulla Royal Cave Temple Complex',
          'Nine Arch Bridge & Ella Gap',
          'Yala National Park Leopard Territory',
        ],
        thingsToDo: [
          'Private sunrise ascent of Sigiriya rock before general admission opens',
          'Scenic vintage observation train ride through emerald Ceylon tea plantations',
          'Private luxury safari camp jeep with personal naturalist tracker in Yala',
          'High-tea tasting with master tea sommelier in colonial planter bungalow',
        ],
        rating: 4.93,
        reviewsCount: 78,
      },
      {
        title: 'Monte Carlo Grand Riviera',
        country: 'Monaco',
        region: 'Mediterranean',
        travelType: 'Luxury',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 'From $5,500',
        budgetNumeric: 5500,
        estimatedBudget: {
          tier: 'Sovereign Prestige',
          avgNightly: '$1,800 – $3,800',
          flightEst: '$1,500 – $4,200',
          activitiesEst: '$2,200 – $5,000',
          recommendedTotal: '$5,500 – $12,500',
          notes: 'Includes harbour penthouse suite, private helicopter transfer, and Michelin dining.',
        },
        tag: 'Exclusive',
        description: 'Private harbour yacht charters and Mediterranean glamour.',
        bestTimeToVisit: 'May – October (Grand Prix, Monaco Yacht Show & Mediterranean glamour)',
        popularAttractions: [
          'Casino de Monte-Carlo & Place du Casino',
          'Port Hercule Superyacht Marina',
          'Prince’s Palace of Monaco & Old Town',
          'Larvotto Beach Promenade',
        ],
        thingsToDo: [
          'Private berth superyacht reception during Monaco Yacht Show',
          'Supercar driving tour along the scenic Grande Corniche coastal roads',
          'Helicopter transfer from Nice Côte d’Azur airport (7 minutes to Monaco heliport)',
          'VIP private salon table access at the historic Casino de Monte-Carlo',
        ],
        rating: 4.98,
        reviewsCount: 112,
      },
      {
        title: 'Maldives Private Atoll',
        country: 'Maldives',
        region: 'Indian Ocean',
        travelType: 'Beach & Coastal',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 'From $4,800',
        budgetNumeric: 4800,
        estimatedBudget: {
          tier: 'Ultra-Luxury',
          avgNightly: '$1,500 – $3,000',
          flightEst: '$2,000 – $4,800',
          activitiesEst: '$1,400 – $3,200',
          recommendedTotal: '$4,800 – $10,500',
          notes: 'Includes overwater bungalow, private seaplane transfer, and bespoke sandbank dinner.',
        },
        tag: 'Exclusive',
        description: 'Secluded coral atolls, underwater dining pavilions, and private seaplane transfers.',
        bestTimeToVisit: 'November – April (Warm dry sunshine, calm lagoons, prime marine sightings)',
        popularAttractions: [
          'Baa Atoll UNESCO Biosphere Reserve',
          'Hanifaru Bay Manta Feeding Grounds',
          'Male Heritage Friday Mosque',
          'Ari Atoll Whale Shark Sanctuary',
        ],
        thingsToDo: [
          'Private seaplane charter landing directly beside your personal overwater jetty',
          'Underwater dining experience at 5 meters below sea level with vintage champagne',
          'Night snorkeling with bioluminescent plankton and gentle nurse sharks',
          'Bespoke sandbank dinner prepared by personal chef on an uninhabited private islet',
        ],
        rating: 4.99,
        reviewsCount: 153,
      },
    ]

    const destCount = await Destination.countDocuments()
    if (destCount === 0) {
      console.log('[Seeder] Seeding initial rich destinations into MongoDB...')
      await Destination.insertMany(richDestinations)
      console.log(`[Seeder] Successfully seeded ${richDestinations.length} destinations into MongoDB.`)
    } else {
      // Upsert/hydrate rich fields on existing destinations if missing
      console.log('[Seeder] Verifying and hydrating rich destination details in MongoDB...')
      for (const dest of richDestinations) {
        const existing = await Destination.findOne({ title: dest.title })
        if (existing) {
          // If existing lacks gallery or popularAttractions, update it
          if (!existing.gallery || existing.gallery.length === 0 || !existing.popularAttractions || existing.popularAttractions.length === 0) {
            await Destination.findByIdAndUpdate(existing._id, {
              region: dest.region,
              travelType: dest.travelType,
              gallery: dest.gallery,
              budgetNumeric: dest.budgetNumeric,
              estimatedBudget: dest.estimatedBudget,
              bestTimeToVisit: dest.bestTimeToVisit,
              popularAttractions: dest.popularAttractions,
              thingsToDo: dest.thingsToDo,
              rating: dest.rating,
              reviewsCount: dest.reviewsCount,
            })
          }
        } else {
          // Create missing destination (e.g. Maldives)
          await Destination.create(dest)
        }
      }
      console.log('[Seeder] Destination catalog hydration completed.')
    }

    // 2. Seed Default Demo Users if not present
    const demoUser = await User.findOne({ email: 'demo@wanderwave.com' })
    if (!demoUser) {
      console.log('[Seeder] Creating primary demo user: demo@wanderwave.com ...')
      const createdDemo = await User.create({
        name: 'Sophia Martinez',
        email: 'demo@wanderwave.com',
        password: 'Password123!',
        membershipTier: 'Platinum Elite',
      })

      // Create an initial active booking for the demo user
      await Booking.create({
        user: createdDemo._id,
        destinationTitle: 'Amalfi Coast & Capri, Italy',
        flightRoute: 'Rome (FCO) → Naples (NAP)',
        flightStatus: 'Confirmed',
        accommodation: 'Villa TreVille Positano',
        accommodationDetails: 'Cliffside Deluxe Suite • 6 Nights',
        bookingRef: 'WW-89241A',
        checkInDate: 'Oct 12, 2026',
        assignedConcierge: 'Marco Della Valle',
        status: 'Active',
      })
      console.log('[Seeder] Primary demo user created.')
    }

    const travelerUser = await User.findOne({ email: 'traveler@wanderwave.com' })
    if (!travelerUser) {
      console.log('[Seeder] Creating secondary demo user: traveler@wanderwave.com ...')
      const createdTraveler = await User.create({
        name: 'Alex Vance',
        email: 'traveler@wanderwave.com',
        password: 'Adventurer2026!',
        membershipTier: 'Gold Voyager',
      })

      await Booking.create({
        user: createdTraveler._id,
        destinationTitle: 'Kyoto Imperial Gardens, Japan',
        flightRoute: 'Tokyo (HND) → Osaka (KIX)',
        flightStatus: 'Confirmed',
        accommodation: 'Hoshinoya Kyoto Ryokan',
        accommodationDetails: 'River Pavilion Room • 4 Nights',
        bookingRef: 'WW-43189B',
        checkInDate: 'Nov 05, 2026',
        assignedConcierge: 'Kenji Sato',
        status: 'Active',
      })
      console.log('[Seeder] Secondary demo user created.')
    }

    // 3. Seed Default Administrator Account
    const adminUser = await User.findOne({ email: 'admin@wanderwave.com' })
    if (!adminUser) {
      console.log('[Seeder] Creating administrator account: admin@wanderwave.com ...')
      await User.create({
        name: 'WanderWave Admin',
        email: 'admin@wanderwave.com',
        password: 'AdminPassword2026!',
        membershipTier: 'Platinum Elite',
        role: 'admin',
      })
      console.log('[Seeder] Administrator account created successfully.')
    }
  } catch (error) {
    console.error('[Seeder Error]:', error.message)
  }
}
