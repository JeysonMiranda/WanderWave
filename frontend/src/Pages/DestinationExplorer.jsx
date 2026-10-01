import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom'
import {
  Compass,
  Search,
  SlidersHorizontal,
  Heart,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  ShieldCheck,
  Check,
  Plane,
  Award,
  ArrowUpDown,
  Layers,
  ChevronDown
} from 'lucide-react'
import { destinationsAPI } from '../services/api'
import { useLanguage } from '../context/useLanguage'
import { useAuth } from '../context/useAuth'
import LanguageSelector from '../components/LanguageSelector'

export default function DestinationExplorer() {
  const { t, language } = useLanguage()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { id: paramId } = useParams()

  // Data State
  const [destinations, setDestinations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedTravelType, setSelectedTravelType] = useState('all')
  const [selectedBudgetTier, setSelectedBudgetTier] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [onlyWishlist, setOnlyWishlist] = useState(false)

  // Wishlist State synced with localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderwave_wishlist') || '[]')
    } catch {
      return []
    }
  })

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('')

  // Modal / Detail Atelier State
  const [modalDestId, setModalDestId] = useState(null)
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)
  const dialogRef = useRef(null)

  // Derived selected destination for modal (avoids synchronous setState in effect)
  const activeDestId = modalDestId || paramId || searchParams.get('id') || null
  const selectedDestination = useMemo(() => {
    if (!activeDestId || destinations.length === 0) return null
    return (
      destinations.find(
        (d) => d._id === activeDestId || d.title.toLowerCase().includes(activeDestId.toLowerCase())
      ) || null
    )
  }, [activeDestId, destinations])

  // Trigger Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 3000)
  }

  // Wishlist Toggle Handler
  const toggleWishlist = useCallback((destId, title) => {
    setWishlist((prev) => {
      const exists = prev.includes(destId)
      const updated = exists ? prev.filter((id) => id !== destId) : [...prev, destId]
      try {
        localStorage.setItem('wanderwave_wishlist', JSON.stringify(updated))
        window.dispatchEvent(new Event('wanderwave_wishlist_updated'))
      } catch (e) {
        console.error('Failed to update wishlist in localStorage:', e)
      }

      if (exists) {
        showToast(`${title || 'Sanctuary'} removed from wishlist`)
      } else {
        showToast(`${title || 'Sanctuary'} saved to your sovereign wishlist`)
      }

      return updated
    })
  }, [])

  // Listen for storage events (multi-tab or inter-component sync)
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('wanderwave_wishlist') || '[]')
        setWishlist(stored)
      } catch {
        // ignore
      }
    }
    window.addEventListener('wanderwave_wishlist_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('wanderwave_wishlist_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  // Fetch Destinations from API
  useEffect(() => {
    let isMounted = true
    async function loadDestinations() {
      try {
        setIsLoading(true)
        setError('')
        const res = await destinationsAPI.getAll()
        if (isMounted && res.success && res.data) {
          setDestinations(res.data)
        }
      } catch (err) {
        console.error('[DestinationExplorer] Error fetching destinations:', err)
        if (isMounted) setError(err.message || 'Failed to load destinations')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDestinations()
    return () => {
      isMounted = false
    }
  }, [])

  const openDestinationModal = useCallback((dest) => {
    setModalDestId(dest._id)
    setActiveGalleryIndex(0)
    setSearchParams({ id: dest._id })
  }, [setSearchParams])

  const closeModal = useCallback(() => {
    setModalDestId(null)
    setActiveGalleryIndex(0)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('id')
      return next
    })
  }, [setSearchParams])

  // Native Dialog Light-Dismiss Support (Modern Web Guidance fallback)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (selectedDestination) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }

    // Fallback light-dismiss for browsers without closedby support
    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      const isInside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!isInside) {
        closeModal()
      }
    }

    const handleCancel = (e) => {
      e.preventDefault()
      closeModal()
    }

    dialog.addEventListener('click', handleBackdropClick)
    dialog.addEventListener('cancel', handleCancel)

    return () => {
      dialog.removeEventListener('click', handleBackdropClick)
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [selectedDestination, closeModal])

  // Derive Dynamic Filter Options from live destinations
  const availableCountries = useMemo(() => {
    const set = new Set()
    destinations.forEach((d) => {
      if (d.country) set.add(d.country)
    })
    return Array.from(set).sort()
  }, [destinations])

  const availableRegions = useMemo(() => {
    const set = new Set()
    destinations.forEach((d) => {
      if (d.region) set.add(d.region)
    })
    return Array.from(set).sort()
  }, [destinations])

  const travelTypes = useMemo(() => [
    { id: 'all', label: t('filterAllTravelTypes') },
    { id: 'Romantic', label: t('catRomantic') },
    { id: 'Luxury', label: t('catLuxury') },
    { id: 'Adventure', label: t('catAdventure') },
    { id: 'Cultural', label: t('catCultural') },
    { id: 'Heritage', label: t('catHeritage') },
    { id: 'Beach & Coastal', label: 'Beach & Coastal' },
    { id: 'Alpine & Adventure', label: 'Alpine & Snow' },
  ], [t])

  // Filter and Sort Processing
  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      // 1. Wishlist Only filter
      if (onlyWishlist && !wishlist.includes(dest._id)) {
        return false
      }

      // 2. Search Query (matches title, country, region, description, attractions, thingsToDo)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = dest.title?.toLowerCase().includes(q)
        const matchCountry = dest.country?.toLowerCase().includes(q)
        const matchRegion = dest.region?.toLowerCase().includes(q)
        const matchDesc = dest.description?.toLowerCase().includes(q)
        const matchAttractions = dest.popularAttractions?.some((a) =>
          typeof a === 'string' ? a.toLowerCase().includes(q) : a.name?.toLowerCase().includes(q)
        )
        const matchThings = dest.thingsToDo?.some((t) => t.toLowerCase().includes(q))

        if (!matchTitle && !matchCountry && !matchRegion && !matchDesc && !matchAttractions && !matchThings) {
          return false
        }
      }

      // 3. Country Filter
      if (selectedCountry !== 'all' && dest.country?.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false
      }

      // 4. Region Filter
      if (selectedRegion !== 'all' && dest.region?.toLowerCase() !== selectedRegion.toLowerCase()) {
        return false
      }

      // 5. Travel Type Filter
      if (selectedTravelType !== 'all') {
        const destType = (dest.travelType || dest.tag || '').toLowerCase()
        const targetType = selectedTravelType.toLowerCase()
        if (!destType.includes(targetType) && !targetType.includes(destType)) {
          return false
        }
      }

      // 6. Budget Tier Filter
      if (selectedBudgetTier !== 'all') {
        const numeric = dest.budgetNumeric || parseInt((dest.price || '').replace(/\D/g, ''), 10) || 3500
        if (selectedBudgetTier === 'under3000' && numeric >= 3000) return false
        if (selectedBudgetTier === '3000to4500' && (numeric < 3000 || numeric > 4500)) return false
        if (selectedBudgetTier === 'over4500' && numeric <= 4500) return false
      }

      return true
    }).sort((a, b) => {
      const priceA = a.budgetNumeric || parseInt((a.price || '').replace(/\D/g, ''), 10) || 3500
      const priceB = b.budgetNumeric || parseInt((b.price || '').replace(/\D/g, ''), 10) || 3500
      const ratingA = a.rating || 4.9
      const ratingB = b.rating || 4.9

      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      if (sortBy === 'rating_desc') return ratingB - ratingA
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title)
      return 0 // default 'featured' preservation
    })
  }, [
    destinations,
    onlyWishlist,
    wishlist,
    searchQuery,
    selectedCountry,
    selectedRegion,
    selectedTravelType,
    selectedBudgetTier,
    sortBy,
  ])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchQuery.trim()) count++
    if (selectedCountry !== 'all') count++
    if (selectedRegion !== 'all') count++
    if (selectedTravelType !== 'all') count++
    if (selectedBudgetTier !== 'all') count++
    if (onlyWishlist) count++
    return count
  }, [searchQuery, selectedCountry, selectedRegion, selectedTravelType, selectedBudgetTier, onlyWishlist])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCountry('all')
    setSelectedRegion('all')
    setSelectedTravelType('all')
    setSelectedBudgetTier('all')
    setSortBy('featured')
    setOnlyWishlist(false)
  }

  // Gallery Navigation for Modal
  const currentGalleryPhotos = useMemo(() => {
    if (!selectedDestination) return []
    if (Array.isArray(selectedDestination.gallery) && selectedDestination.gallery.length > 0) {
      return selectedDestination.gallery
    }
    return [selectedDestination.image]
  }, [selectedDestination])

  const handleNextPhoto = (e) => {
    e?.stopPropagation()
    setActiveGalleryIndex((prev) => (prev + 1) % currentGalleryPhotos.length)
  }

  const handlePrevPhoto = (e) => {
    e?.stopPropagation()
    setActiveGalleryIndex((prev) => (prev - 1 + currentGalleryPhotos.length) % currentGalleryPhotos.length)
  }

  return (
    <div key={language} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Compass className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-serif">
                  {t('brandName')}
                </span>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  {t('brandTag')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider">
                {t('brandSubtitle')}
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-amber-400 transition-colors">
              {t('home')}
            </Link>
            <Link
              to="/destinations"
              className="text-amber-400 font-semibold flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>{t('navDestinations')}</span>
            </Link>
            <Link to="/book" className="hover:text-amber-400 transition-colors">
              {t('bookVoyage')}
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="hover:text-amber-400 transition-colors">
                {t('dashboard')}
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-amber-400/90 hover:text-amber-300 transition-colors">
                {t('adminConsole')}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSelector />

            {/* Auth CTA or Dashboard Link */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-white transition-colors flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="max-w-[120px] truncate">{user?.name || 'Traveler'}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-colors"
                >
                  {t('signOut')}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>{t('signIn')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO & SEARCH BANNER */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-900 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold tracking-wide uppercase">
            <Compass className="w-3.5 h-3.5" />
            <span>{t('explorerTag')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-serif max-w-3xl mx-auto">
            {t('explorerTitle')}
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
            {t('explorerSubtitle')}
          </p>

          {/* Search Box Bar */}
          <div className="max-w-2xl mx-auto pt-3">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchSanctuariesPlaceholder')}
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 shadow-xl transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-14 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="absolute right-3.5 px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-semibold text-slate-400 border border-slate-700">
                {filteredDestinations.length} {t('sanctuariesFound')}
              </div>
            </div>
          </div>

          {/* Trust Specs Ribbon */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-amber-400" />
              <span>Private Jet FBO Links</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>100% Diplomatic Discretion</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Michelin & Private Butler Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER CONTROLS & CATALOG ATELIER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* FILTERS TOOLBAR */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Filter & Refine Sanctuaries</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Wishlist Toggle Button */}
              <button
                type="button"
                onClick={() => setOnlyWishlist(!onlyWishlist)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  onlyWishlist
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${onlyWishlist ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`} />
                <span>{t('showWishlistOnly')}</span>
                {wishlist.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-amber-300 border border-slate-700">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Reset Filters CTA */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('clearAllFilters')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdown Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Country Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{t('filterCountry')}</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white appearance-none focus:outline-none focus:border-amber-400 pr-8"
                >
                  <option value="all">{t('filterAllCountries')}</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Region Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
                <Compass className="w-3 h-3 text-amber-400" />
                <span>{t('filterRegion')}</span>
              </label>
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white appearance-none focus:outline-none focus:border-amber-400 pr-8"
                >
                  <option value="all">{t('filterAllRegions')}</option>
                  {availableRegions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Budget Tier Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-400" />
                <span>{t('filterBudget')}</span>
              </label>
              <div className="relative">
                <select
                  value={selectedBudgetTier}
                  onChange={(e) => setSelectedBudgetTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white appearance-none focus:outline-none focus:border-amber-400 pr-8"
                >
                  <option value="all">{t('filterAllBudgets')}</option>
                  <option value="under3000">{t('budgetUnder3000')}</option>
                  <option value="3000to4500">{t('budget3000to4500')}</option>
                  <option value="over4500">{t('budgetOver4500')}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Sort Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-amber-400" />
                <span>Sort Sanctuaries</span>
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white appearance-none focus:outline-none focus:border-amber-400 pr-8"
                >
                  <option value="featured">{t('sortOptionFeatured')}</option>
                  <option value="price_asc">{t('sortOptionPriceAsc')}</option>
                  <option value="price_desc">{t('sortOptionPriceDesc')}</option>
                  <option value="rating_desc">{t('sortOptionRating')}</option>
                  <option value="title_asc">Alphabetical (A - Z)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Travel Style Filter Pills */}
          <div className="pt-2 border-t border-slate-850 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>{t('filterTravelType')}:</span>
            </span>
            {travelTypes.map((type) => {
              const isActive = selectedTravelType.toLowerCase() === type.id.toLowerCase()
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedTravelType(type.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800'
                  }`}
                >
                  {type.label}
                </button>
              )
            })}
          </div>

          {/* Active Filter Badges Display */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">{t('activeFiltersLabel')}</span>
              {searchQuery && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                  <span>Keyword: "{searchQuery}"</span>
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-amber-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedCountry !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                  <span>Country: {selectedCountry}</span>
                  <button type="button" onClick={() => setSelectedCountry('all')} className="hover:text-amber-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedRegion !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                  <span>Region: {selectedRegion}</span>
                  <button type="button" onClick={() => setSelectedRegion('all')} className="hover:text-amber-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedTravelType !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                  <span>Style: {selectedTravelType}</span>
                  <button type="button" onClick={() => setSelectedTravelType('all')} className="hover:text-amber-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBudgetTier !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                  <span>Budget Tier</span>
                  <button type="button" onClick={() => setSelectedBudgetTier('all')} className="hover:text-amber-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {onlyWishlist && (
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <span>Wishlist Only</span>
                  <button type="button" onClick={() => setOnlyWishlist(false)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* LOADING & ERROR STATES */}
        {isLoading && (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 tracking-wider">Accessing sovereign retreat catalog...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
            <p className="text-sm text-rose-400 font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs text-amber-400 underline hover:text-amber-300"
            >
              Reload catalog
            </button>
          </div>
        )}

        {/* EMPTY SEARCH RESULT */}
        {!isLoading && !error && filteredDestinations.length === 0 && (
          <div className="py-20 text-center space-y-4 p-8 rounded-3xl bg-slate-900/30 border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white font-serif">{t('noDestinationsFound')}</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{t('noDestinationsHint')}</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {t('clearAllFilters')}
            </button>
          </div>
        )}

        {/* DESTINATION CARDS GRID */}
        {!isLoading && !error && filteredDestinations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest) => {
              const isSaved = wishlist.includes(dest._id)
              const firstAttraction =
                dest.popularAttractions && dest.popularAttractions.length > 0
                  ? typeof dest.popularAttractions[0] === 'string'
                    ? dest.popularAttractions[0]
                    : dest.popularAttractions[0].name
                  : null

              return (
                <div
                  key={dest._id}
                  className="group rounded-3xl bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col justify-between"
                >
                  {/* Top Photo & Overlays */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={dest.image}
                      alt={dest.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

                    {/* Tag Badge */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 items-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-400/30">
                        {dest.tag || dest.travelType || 'Exclusive'}
                      </span>
                      {dest.region && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-semibold text-slate-300 border border-slate-700/80">
                          {dest.region}
                        </span>
                      )}
                    </div>

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(dest._id, dest.title)}
                      aria-label="Add to wishlist"
                      className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 backdrop-blur-md ${
                        isSaved
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                          : 'bg-slate-950/60 hover:bg-slate-900/90 text-slate-300 hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
                    </button>

                    {/* Gallery Photos Counter Pill */}
                    {dest.gallery && dest.gallery.length > 0 && (
                      <div className="absolute bottom-3 right-4 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-slate-300 flex items-center gap-1 border border-white/10">
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span>{dest.gallery.length} Photos</span>
                      </div>
                    )}

                    {/* Country & Rating Badge */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-white bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{dest.country}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{dest.rating || 4.95}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3
                        onClick={() => openDestinationModal(dest)}
                        className="text-lg font-bold text-white font-serif hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
                      >
                        {dest.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-light line-clamp-2 leading-relaxed">
                        {dest.description || 'Exclusive luxury sanctuary with private butler and dedicated aviation logistics.'}
                      </p>
                    </div>

                    {/* Highlights Preview: Best Time & Top Attraction */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px]">
                      {dest.bestTimeToVisit && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-slate-400 font-medium">Best:</span>
                          <span className="truncate">{dest.bestTimeToVisit}</span>
                        </div>
                      )}
                      {firstAttraction && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-slate-400 font-medium">Key Spot:</span>
                          <span className="truncate">{firstAttraction}</span>
                        </div>
                      )}
                    </div>

                    {/* Price and Action CTAs */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                          Estimated Budget
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-amber-400 font-serif">
                            {dest.price}
                          </span>
                          <span className="text-[10px] text-slate-500">/ stay</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDestinationModal(dest)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t('exploreDetails')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/book?dest=${dest._id}`)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{t('bookSanctuary')}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* MODAL: DESTINATION DETAILS ATELIER (Modern Web Guidance Compliant Dialog) */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="atelierDestinationTitle"
        className="w-full max-w-4xl max-h-[90vh] bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 p-0 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-md overflow-hidden focus:outline-none"
      >
        {selectedDestination && (
          <div className="flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header & Interactive Photo Gallery */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-slate-950 w-full shrink-0">
              <img
                src={currentGalleryPhotos[activeGalleryIndex] || selectedDestination.image}
                alt={selectedDestination.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Photo Carousel Controls */}
              {currentGalleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    aria-label="Previous photo"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    aria-label="Next photo"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 right-6 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
                    {activeGalleryIndex + 1} / {currentGalleryPhotos.length} {t('photoCount')}
                  </div>
                </>
              )}

              {/* Title & Badges in Overlay */}
              <div className="absolute bottom-4 left-6 space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] tracking-wide uppercase">
                    {selectedDestination.tag || selectedDestination.travelType || 'Exclusive'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900/90 text-amber-300 font-semibold text-[10px] border border-amber-400/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{selectedDestination.rating || 4.95} Sovereign Score</span>
                  </span>
                </div>
                <h2 id="atelierDestinationTitle" className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  {selectedDestination.title}
                </h2>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedDestination.country}</span>
                  {selectedDestination.region && <span>• {selectedDestination.region}</span>}
                </p>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {currentGalleryPhotos.length > 1 && (
              <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-3 overflow-x-auto">
                {currentGalleryPhotos.map((photo, idx) => (
                  <button
                    key={photo}
                    type="button"
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeGalleryIndex === idx
                        ? 'border-amber-400 scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 space-y-8 flex-1">
              {/* Atmospheric Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sanctuary Overview & Atmosphere</span>
                </h3>
                <p className="text-sm text-slate-300 font-light leading-relaxed">
                  {selectedDestination.description || 'Secluded sanctuary engineered for the world\'s most discerning voyagers. Offering dedicated aviation handling, private sea and land transfers, and around-the-clock master concierge support.'}
                </p>
              </div>

              {/* Best Time to Visit & Climate */}
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{t('bestTime')}</span>
                </h4>
                <p className="text-xs sm:text-sm text-white font-medium">
                  {selectedDestination.bestTimeToVisit || 'May to October (Peak Mediterranean Sailing Season)'}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ideal meteorological conditions, calm private mooring bays, and optimal visibility for private aviation landings.
                </p>
              </div>

              {/* Popular Attractions */}
              {selectedDestination.popularAttractions && selectedDestination.popularAttractions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{t('popularAttractionsTitle')}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDestination.popularAttractions.map((attr, idx) => {
                      const name = typeof attr === 'string' ? attr : attr.name
                      const highlight = typeof attr === 'object' ? attr.highlight : null
                      return (
                        <div
                          key={name || idx}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{name}</span>
                            {highlight && <p className="text-[11px] text-slate-400 font-light mt-0.5">{highlight}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Things to Do & Signature Experiences */}
              {selectedDestination.thingsToDo && selectedDestination.thingsToDo.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>{t('thingsToDoTitle')}</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedDestination.thingsToDo.map((thing, idx) => (
                      <div
                        key={thing || idx}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-200"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="font-light">{thing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transparent Budget Estimate Breakdown */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>{t('estimatedBudgetTitle')}</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-bold text-[10px] border border-amber-400/20">
                    {selectedDestination.estimatedBudget?.tier || 'Ultra-Luxury'} Tier
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                    <span className="text-[10px] text-slate-400 block">{t('nightlyEstimate')}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {selectedDestination.estimatedBudget?.avgNightly || '$1,200 – $2,400'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                    <span className="text-[10px] text-slate-400 block">{t('flightLogistics')}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {selectedDestination.estimatedBudget?.flightEst || '$1,400 – $3,200'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                    <span className="text-[10px] text-slate-400 block">{t('curatedExperiences')}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {selectedDestination.estimatedBudget?.activitiesEst || '$1,200 – $2,800'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] text-amber-400 block font-semibold">{t('recommendedTotal')}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                      {selectedDestination.estimatedBudget?.recommendedTotal || selectedDestination.price}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-light italic">
                  * {selectedDestination.estimatedBudget?.notes || 'Includes private chartered aviation transfer, luxury villa accommodation, VIP airside handling, and 24/7 dedicated personal concierge.'}
                </p>
              </div>
            </div>

            {/* Modal Sticky Bottom Action Rail */}
            <div className="p-4 sm:p-6 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleWishlist(selectedDestination._id, selectedDestination.title)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                    wishlist.includes(selectedDestination._id)
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${wishlist.includes(selectedDestination._id) ? 'fill-white' : ''}`} />
                  <span>
                    {wishlist.includes(selectedDestination._id) ? t('inWishlist') : t('addToWishlist')}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white transition-colors"
                >
                  {t('closeModal')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeModal()
                    navigate(`/book?dest=${selectedDestination._id}`)
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{t('bookSanctuary')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-2">
        <p>© 2026 WanderWave Journeys Ltd. Sovereign Bespoke Travel Atelier.</p>
        <p className="text-[11px] text-slate-400">
          Geneva • New York • Tokyo • London • Monaco • Colombo
        </p>
      </footer>
    </div>
  )
}
