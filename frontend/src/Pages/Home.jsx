import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Sparkles,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Star,
  ShieldCheck,
  Plane,
  Compass,
  ChevronDown,
  ChevronUp,
  Heart,
  X,
  SlidersHorizontal,
  Award,
  Check,
  Clock,
  PhoneCall,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import { useAuth } from '../context/useAuth'
import { destinationsAPI, bookingsAPI } from '../services/api'
import LanguageSelector from '../components/LanguageSelector'

export default function Home() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { user, isAuthenticated, logout } = useAuth()

  // Data states
  const [destinations, setDestinations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Interactive filtering states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const [sortBy, setSortBy] = useState('default') // 'default', 'price-low', 'price-high'

  // Interactive Wishlist (saved in localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderwave_wishlist') || '[]')
    } catch {
      return []
    }
  })

  // Interactive Itinerary Modal state
  const [selectedDestModal, setSelectedDestModal] = useState(null)
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false)
  const [bookingSuccessNotice, setBookingSuccessNotice] = useState('')

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)

  // Category translation helper
  const getCategoryLabel = (tag) => {
    const map = {
      All: t('catAll'),
      Romantic: t('catRomantic'),
      Luxury: t('catLuxury'),
      Adventure: t('catAdventure'),
      Heritage: t('catHeritage'),
      Cultural: t('catCultural'),
    }
    return map[tag] || tag
  }

  // Dynamic Value proposition pillars
  const pillars = useMemo(() => [
    {
      icon: Plane,
      title: t('pillar1Title'),
      desc: t('pillar1Desc'),
    },
    {
      icon: Compass,
      title: t('pillar2Title'),
      desc: t('pillar2Desc'),
    },
    {
      icon: Sparkles,
      title: t('pillar3Title'),
      desc: t('pillar3Desc'),
    },
    {
      icon: ShieldCheck,
      title: t('pillar4Title'),
      desc: t('pillar4Desc'),
    },
  ], [t])

  // Dynamic Real traveler reviews
  const reviews = useMemo(() => [
    {
      name: 'Eleanor & Julian Vance',
      role: t('review1Role'),
      rating: 5,
      dest: t('review1Dest'),
      text: t('review1Text'),
      avatar: 'EV',
    },
    {
      name: 'Marcus Sterling',
      role: t('review2Role'),
      rating: 5,
      dest: t('review2Dest'),
      text: t('review2Text'),
      avatar: 'MS',
    },
    {
      name: 'Dr. Alistair & Clara Chen',
      role: t('review3Role'),
      rating: 5,
      dest: t('review3Dest'),
      text: t('review3Text'),
      avatar: 'AC',
    },
  ], [t])

  // Dynamic FAQ items
  const faqs = useMemo(() => [
    {
      q: t('faq1Q'),
      a: t('faq1A'),
    },
    {
      q: t('faq2Q'),
      a: t('faq2A'),
    },
    {
      q: t('faq3Q'),
      a: t('faq3A'),
    },
    {
      q: t('faq4Q'),
      a: t('faq4A'),
    },
  ], [t])

  // Fetch live destinations from MongoDB database
  useEffect(() => {
    let isMounted = true

    async function loadDestinations() {
      try {
        setIsLoading(true)
        const response = await destinationsAPI.getAll()
        if (isMounted && response.success) {
          setDestinations(response.data || [])
        }
      } catch (error) {
        console.error('[Home] Failed to fetch destinations from MongoDB:', error)
        if (isMounted) {
          setFetchError(error.message || 'Unable to load destinations from database')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDestinations()

    return () => {
      isMounted = false
    }
  }, [])

  // Toggle wishlist item
  const toggleWishlist = (destId) => {
    setWishlist((prev) => {
      const updated = prev.includes(destId)
        ? prev.filter((id) => id !== destId)
        : [...prev, destId]
      localStorage.setItem('wanderwave_wishlist', JSON.stringify(updated))
      return updated
    })
  }

  // Extract unique category tags for filter buttons
  const availableTags = useMemo(() => {
    const tags = new Set(['All'])
    destinations.forEach((d) => {
      if (d.tag) tags.add(d.tag)
    })
    return Array.from(tags)
  }, [destinations])

  // Filtered & sorted destinations
  const filteredDestinations = useMemo(() => {
    return destinations
      .filter((d) => {
        const matchesTag = selectedTag === 'All' || d.tag.toLowerCase() === selectedTag.toLowerCase()
        const q = searchQuery.toLowerCase().trim()
        const matchesSearch =
          !q ||
          d.title.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
        return matchesTag && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') {
          const pA = parseInt((a.price || '').replace(/\D/g, ''), 10) || 0
          const pB = parseInt((b.price || '').replace(/\D/g, ''), 10) || 0
          return pA - pB
        }
        if (sortBy === 'price-high') {
          const pA = parseInt((a.price || '').replace(/\D/g, ''), 10) || 0
          const pB = parseInt((b.price || '').replace(/\D/g, ''), 10) || 0
          return pB - pA
        }
        return 0
      })
  }, [destinations, selectedTag, searchQuery, sortBy])

  // Handle instant reservation from modal
  const handleConfirmReservation = async (destination) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      setIsBookingSubmitting(true)
      const bookingData = {
        destinationTitle: `${destination.title}, ${destination.country}`,
        flightRoute: `Geneva (GVA) → ${destination.country} Private Charter`,
        accommodation: `${destination.title} Luxury Villa`,
        accommodationDetails: `${destination.tag} Oceanfront Suite • 7 Nights • Private Butler`,
        checkInDate: 'Nov 14, 2026',
      }

      const res = await bookingsAPI.create(bookingData)
      if (res.success) {
        setBookingSuccessNotice(`Reservation confirmed for ${destination.title}! Redirecting to your dashboard...`)
        setTimeout(() => {
          setSelectedDestModal(null)
          navigate('/dashboard')
        }, 1800)
      }
    } catch (err) {
      console.error('[Booking error]:', err)
      setBookingSuccessNotice(err.message || 'Unable to complete reservation.')
    } finally {
      setIsBookingSubmitting(false)
    }
  }

  // Newsletter submit
  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (!newsletterEmail || !newsletterEmail.includes('@')) return
    setNewsletterSubscribed(true)
    setNewsletterEmail('')
  }

  return (
    <div key={language} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* TOP NAVIGATION */}
      <header className="px-6 lg:px-12 py-3.5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
            {t('brandName')} <span className="text-amber-400 text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">{t('brandTag')}</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-medium">
          <Link to="/" className="text-amber-400 font-semibold hidden sm:inline-block">
            {t('home')}
          </Link>
          <Link to="/destinations" className="text-slate-300 hover:text-amber-300 transition-colors hidden sm:inline-block">
            {t('navDestinations')}
          </Link>
          <a href="#destinations" className="text-slate-300 hover:text-white transition-colors hidden md:inline-block">
            {t('navItineraries')}
          </a>
          <Link to="/book" className="text-amber-300 hover:text-amber-200 transition-colors hidden sm:inline-block font-semibold">
            {t('bookVoyage')}
          </Link>
          <a href="#experience" className="text-slate-300 hover:text-white transition-colors hidden lg:inline-block">
            {t('navExperience')}
          </a>

          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold hover:bg-purple-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{t('adminConsole')}</span>
                </Link>
              )}
              <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                {t('dashboard')}
              </Link>
              <LanguageSelector />
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold hover:border-slate-700 transition-colors"
                >
                  {user?.name} ({user?.membershipTier || 'Member'})
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-755 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  {t('signOut')}
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
                {t('login')}
              </Link>
              <Link to="/signin" className="text-slate-300 hover:text-white transition-colors hidden sm:inline-block">
                {t('signIn')}
              </Link>
              <LanguageSelector />
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold shadow-md hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer text-xs"
              >
                {t('accessPortal')}
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* HERO SECTION WITH LUXURY BACKGROUND IMAGE */}
      <section className="relative min-h-[82vh] lg:min-h-[88vh] flex items-center justify-center px-6 lg:px-12 py-20 overflow-hidden">
        {/* Big Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=85"
            alt="Luxury Private Island Overwater Sanctuary"
            className="w-full h-full object-cover object-center scale-105 animate-in fade-in duration-1000"
          />
          {/* Multi-layered luxury gradients for supreme readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80"></div>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-7 pt-6">
          {/* Top Floating Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300 shadow-xl">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{t('heroBadge')}</span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-lg">
            {t('heroMainTitle1')}{' '}
            <span className="bg-gradient-to-r from-amber-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
              {t('heroMainTitleHighlight')}
            </span>
            .
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-xl text-slate-200 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            {t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <a
              href="#destinations"
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <span>{t('exploreJourneysBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to={isAuthenticated ? '/dashboard' : '/signup'}
              className="px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 text-white border border-white/20 font-semibold text-sm backdrop-blur-md transition-all cursor-pointer hover:border-amber-400/50"
            >
              {isAuthenticated ? t('viewMyBookings') : t('joinSovereignCircle')}
            </Link>
          </div>

          {/* Trust Floating Pills */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="p-3 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 text-left">
              <div className="flex items-center gap-1 text-amber-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs font-bold text-white">{t('ratingScore')}</p>
              <p className="text-[11px] text-slate-400">{t('voyagerCount')}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 text-left">
              <Plane className="w-4 h-4 text-cyan-400 mb-1" />
              <p className="text-xs font-bold text-white">{t('privateTransfers')}</p>
              <p className="text-[11px] text-slate-400">{t('heliJetTransfers')}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
              <p className="text-xs font-bold text-white">{t('iataCertified')}</p>
              <p className="text-[11px] text-slate-400">{t('zeroPenaltyFlex')}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 text-left">
              <Clock className="w-4 h-4 text-purple-400 mb-1" />
              <p className="text-xs font-bold text-white">{t('concierge247')}</p>
              <p className="text-[11px] text-slate-400">{t('instantAssist')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DESTINATIONS SHOWCASE & FILTER BAR */}
      <section id="destinations" className="px-6 lg:px-12 py-16 max-w-7xl mx-auto w-full space-y-8 scroll-mt-20">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                {t('curatedPortfolio')}
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{t('liveDatabase')}</span>
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
              {t('extraordinaryItineraries')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              {t('filterSubtitle')}
            </p>
          </div>

          {/* Quick Counter & Explorer Link */}
          <div className="flex flex-col sm:items-end gap-2">
            <p className="text-xs text-slate-400">
              {t('showing')} <strong className="text-white">{filteredDestinations.length}</strong> {t('of')}{' '}
              <strong className="text-amber-400">{destinations.length}</strong> {t('journeys')}
            </p>
            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all hover:scale-105"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Full Destination Explorer</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* INTERACTIVE SEARCH & FILTER CONTROLS */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
                }`}
              >
                {getCategoryLabel(tag)}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="default">{t('sortDefault')}</option>
              <option value="price-low">{t('sortPriceLow')}</option>
              <option value="price-high">{t('sortPriceHigh')}</option>
            </select>
          </div>
        </div>

        {/* Database Error Banner */}
        {fetchError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {fetchError}
          </div>
        )}

        {/* DESTINATIONS GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-slate-900/60 rounded-3xl border border-slate-800"></div>
            ))}
          </div>
        ) : filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest) => {
              const isWishlisted = wishlist.includes(dest._id)

              return (
                <div
                  key={dest._id}
                  className="group bg-slate-900/80 rounded-3xl border border-slate-800/80 overflow-hidden hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between"
                >
                  {/* Photo Container */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={dest.image}
                      alt={dest.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20"></div>

                    {/* Tag badge */}
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-md">
                      {getCategoryLabel(dest.tag)}
                    </span>

                    {/* Wishlist toggle heart button */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(dest._id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                        isWishlisted
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/10'
                      }`}
                      title={isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                    </button>

                    {/* Country tag pinned at bottom of photo */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-slate-200 drop-shadow">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-semibold">{dest.country}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                        {dest.title}
                      </h3>
                      {dest.description && (
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {dest.description}
                        </p>
                      )}
                    </div>

                    {/* Perks snippet */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> {t('perkYacht')}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> {t('perkEstate')}
                      </span>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('startingFrom')}</span>
                        <span className="text-sm font-extrabold text-amber-400">{dest.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDestModal(dest)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {t('detailsBtn')}
                        </button>
                        <Link
                          to={`/book?dest=${dest._id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
                        >
                          <span>{t('reserveBtn')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-white">{t('noVoyagesFound')}</p>
            <p>{t('noVoyagesSub')}</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedTag('All'); }}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {t('resetFiltersBtn')}
            </button>
          </div>
        )}
      </section>

      {/* WHY CHOOSE WANDERWAVE VALUE PILLARS */}
      <section id="experience" className="px-6 lg:px-12 py-16 bg-slate-900/40 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {t('wanderwaveStandard')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('bespokeLuxuryTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('standardSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, idx) => {
              const IconComponent = p.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 transition-all hover:scale-[1.02] shadow-xl space-y-3 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* VERIFIED TRAVELER STORIES & TESTIMONIALS */}
      <section className="px-6 lg:px-12 py-16 max-w-7xl mx-auto w-full space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              {t('verifiedVoyages')}
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              {t('voyagerWords')}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold text-white">{t('overallScore')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, index) => (
            <div
              key={index}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20 font-medium">
                    {rev.dest}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  "{rev.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {rev.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{rev.name}</h4>
                  <p className="text-[11px] text-amber-400 font-medium">{rev.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE FAQ ACCORDION */}
      <section className="px-6 lg:px-12 py-16 bg-slate-900/30 border-t border-slate-900">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {t('faqBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {t('faqTitle')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, fIdx) => {
              const isOpen = openFaqIndex === fIdx
              return (
                <div
                  key={fIdx}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer text-sm font-bold text-white hover:text-amber-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* VIP SOVEREIGN CIRCLE NEWSLETTER */}
      <section className="px-6 lg:px-12 py-16 max-w-5xl mx-auto w-full">
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/20 p-8 sm:p-12 overflow-hidden shadow-2xl text-center space-y-6">
          <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {t('invitationsOnly')}
          </span>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t('newsletterTitle')}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            {t('newsletterSubtitle')}
          </p>

          {newsletterSubscribed ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('newsletterSubscribedNotice')}</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={t('newsletterPlaceholder')}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                {t('requestAccessBtn')}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ITINERARY DETAILS & RESERVATION MODAL */}
      {selectedDestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {getCategoryLabel(selectedDestModal.tag)}
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  {selectedDestModal.title}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedDestModal.country}</span>
                  <span>&bull;</span>
                  <span className="text-amber-400 font-bold">{selectedDestModal.price}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDestModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo */}
            <div className="h-64 rounded-2xl overflow-hidden relative">
              <img
                src={selectedDestModal.image}
                alt={selectedDestModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent"></div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('voyageOverview')}</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                {selectedDestModal.description || 'An ultra-exclusive bespoke luxury journey curated by master journey designers.'}
              </p>
            </div>

            {/* Day-by-Day Itinerary Highlights */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('curatedSchedule')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-0.5">{t('day1Title')}</span>
                  <span className="text-slate-400">{t('day1Desc')}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-0.5">{t('day2Title')}</span>
                  <span className="text-slate-400">{t('day2Desc')}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-0.5">{t('day4Title')}</span>
                  <span className="text-slate-400">{t('day4Desc')}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-0.5">{t('day6Title')}</span>
                  <span className="text-slate-400">{t('day6Desc')}</span>
                </div>
              </div>
            </div>

            {/* Success notification */}
            {bookingSuccessNotice && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bookingSuccessNotice}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                <span>{t('totalPackage')} </span>
                <strong className="text-white font-bold">{selectedDestModal.price}</strong>
                <span> {t('allInclusions')}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedDestModal(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t('closeBtn')}
                </button>
                <Link
                  to={`/book?dest=${selectedDestModal._id}`}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Customize Itinerary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleConfirmReservation(selectedDestModal)}
                  disabled={isBookingSubmitting}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBookingSubmitting ? (
                    <span>{t('confirming')}</span>
                  ) : (
                    <>
                      <span>{isAuthenticated ? t('confirmReservation') : t('signInToReserve')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RICH REAL WEBPAGE FOOTER */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 pt-16 pb-12 px-6 lg:px-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center shadow-md">
                <Plane className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">WanderWave Journeys</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed font-light max-w-sm">
              {t('footerBio')}
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-[11px]"><PhoneCall className="w-3.5 h-3.5 text-amber-400" /> +1 (800) 892-9283</span>
              <span>&bull;</span>
              <span className="text-[11px]">{t('footerCities')}</span>
            </div>
          </div>

          {/* Col 2: Destinations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t('footerCollections')}</h4>
            <ul className="space-y-2">
              <li><a href="#destinations" className="hover:text-amber-400 transition-colors">Amalfi & Capri</a></li>
              <li><a href="#destinations" className="hover:text-amber-400 transition-colors">Santorini Suites</a></li>
              <li><a href="#destinations" className="hover:text-amber-400 transition-colors">Bora Bora Overwater</a></li>
              <li><a href="#destinations" className="hover:text-amber-400 transition-colors">Swiss Alpine Glaciers</a></li>
              <li><a href="#destinations" className="hover:text-amber-400 transition-colors">Kyoto Imperial Gardens</a></li>
              <li><a href="#destinations" className="hover:text-amber-400 transition-colors">Sigiriya Heritage Ceylon</a></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t('footerAtelier')}</h4>
            <ul className="space-y-2">
              <li><a href="#experience" className="hover:text-amber-400 transition-colors">{t('wanderwaveStandard')}</a></li>
              <li><Link to={isAuthenticated ? '/dashboard' : '/login'} className="hover:text-amber-400 transition-colors">{t('dashboard')}</Link></li>
              <li><Link to="/login" className="hover:text-amber-400 transition-colors">Sovereign Society</Link></li>
              <li><a href="#experience" className="hover:text-amber-400 transition-colors">Charter Aviation Fleet</a></li>
              <li><a href="#experience" className="hover:text-amber-400 transition-colors">Safety & Protection</a></li>
            </ul>
          </div>

          {/* Col 4: Trust & Accreditations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t('footerStandards')}</h4>
            <div className="space-y-2 text-[11px] text-slate-500">
              <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> IATA Registered Agent #92831</p>
              <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 256-Bit SSL Encrypted Vault</p>
              <p className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-400" /> Conde Nast Luxury Nominee 2026</p>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto w-full pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>{t('footerRights')}</p>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-slate-400 transition-colors">{t('privacy')}</a>
            <span>&bull;</span>
            <a href="#terms" className="hover:text-slate-400 transition-colors">{t('terms')}</a>
            <span>&bull;</span>
            <a href="#cookies" className="hover:text-slate-400 transition-colors">{t('cookiePreferences')}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
