import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plane,
  Compass,
  MapPin,
  Calendar,
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
  Heart,
  X,
  Check,
  Copy,
  CheckCircle2,
  Printer,
  ArrowRight,
  User,
  LogOut,
  SlidersHorizontal,
  PhoneCall,
  Trash2,
  FileText,
  Star,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import { useAuth } from '../context/useAuth'
import { bookingsAPI, destinationsAPI } from '../services/api'
import LanguageSelector from '../components/LanguageSelector'
import ReviewModal from '../components/ReviewModal'

export default function Dashboard() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()

  // Tab State: 'bookings' | 'wishlist' | 'membership' | 'preferences'
  const [activeTab, setActiveTab] = useState('bookings')

  // Data States
  const [bookings, setBookings] = useState([])
  const [allDestinations, setAllDestinations] = useState([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [actionNotice, setActionNotice] = useState(null) // { type: 'success' | 'error', text: '' }

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedReviewBooking, setSelectedReviewBooking] = useState(null)

  // Wishlist State from localStorage
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderwave_wishlist') || '[]')
    } catch {
      return []
    }
  })

  // Booking UI States
  const [bookingFilter, setBookingFilter] = useState('all') // 'all', 'active', 'cancelled'
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [copiedRef, setCopiedRef] = useState('')
  const [cancelingId, setCancelingId] = useState(null)
  const [reservingId, setReservingId] = useState(null)

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Fetch traveler bookings & destinations
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (!isAuthenticated) return

      try {
        setIsLoadingBookings(true)
        const [bookingsRes, destsRes] = await Promise.all([
          bookingsAPI.getMyBookings(),
          destinationsAPI.getAll().catch(() => ({ data: [] })),
        ])

        if (isMounted) {
          if (bookingsRes.success) {
            setBookings(bookingsRes.data || [])
          }
          if (destsRes.success) {
            setAllDestinations(destsRes.data || [])
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error)
        if (isMounted) {
          setFetchError(error.message || 'Failed to load bookings from database')
        }
      } finally {
        if (isMounted) {
          setIsLoadingBookings(false)
        }
      }
    }

    if (isAuthenticated) {
      loadData()
    }

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  // Sign out handler
  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  // Copy reference code with feedback
  const handleCopyRef = (ref) => {
    navigator.clipboard.writeText(ref)
    setCopiedRef(ref)
    setTimeout(() => setCopiedRef(''), 2000)
  }

  // Cancel traveler booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(t('cancelConfirmText'))) return

    try {
      setCancelingId(bookingId)
      const res = await bookingsAPI.cancel(bookingId)
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId
              ? { ...b, status: 'Cancelled', flightStatus: 'Cancelled' }
              : b
          )
        )
        setActionNotice({
          type: 'success',
          text: `Reservation ${bookingId.slice(-6)} has been cancelled successfully.`,
        })
      }
    } catch (err) {
      console.error('[Dashboard cancel error]:', err)
      setActionNotice({
        type: 'error',
        text: err.message || 'Unable to cancel reservation at this time.',
      })
    } finally {
      setCancelingId(null)
      setTimeout(() => setActionNotice(null), 4000)
    }
  }

  // Remove from Wishlist
  const handleRemoveWishlist = (destId) => {
    const updated = wishlistIds.filter((id) => id !== destId)
    setWishlistIds(updated)
    localStorage.setItem('wanderwave_wishlist', JSON.stringify(updated))
  }

  // Reserve directly from Wishlist
  const handleReserveWishlist = async (dest) => {
    try {
      setReservingId(dest._id)
      const payload = {
        destinationTitle: `${dest.title}, ${dest.country}`,
        flightRoute: `Geneva (GVA) → ${dest.country} Private Charter`,
        accommodation: `${dest.title} Luxury Villa`,
        accommodationDetails: `${dest.tag} Oceanfront Suite • 7 Nights • Private Butler`,
        checkInDate: 'Dec 18, 2026',
      }
      const res = await bookingsAPI.create(payload)
      if (res.success) {
        setBookings((prev) => [res.data, ...prev])
        setActiveTab('bookings')
        setActionNotice({
          type: 'success',
          text: `Expedition to ${dest.title} reserved successfully! Added to your itineraries.`,
        })
      }
    } catch (err) {
      console.error('[Dashboard Wishlist Reserve Error]:', err)
      setActionNotice({
        type: 'error',
        text: err.message || 'Failed to complete instant reservation.',
      })
    } finally {
      setReservingId(null)
      setTimeout(() => setActionNotice(null), 4000)
    }
  }

  // Matched wishlist destinations
  const wishlistDestinations = useMemo(() => {
    return allDestinations.filter((d) => wishlistIds.includes(d._id))
  }, [allDestinations, wishlistIds])

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    if (bookingFilter === 'active') {
      return bookings.filter((b) => b.status !== 'Cancelled')
    }
    if (bookingFilter === 'cancelled') {
      return bookings.filter((b) => b.status === 'Cancelled')
    }
    return bookings
  }, [bookings, bookingFilter])

  // Active bookings count
  const activeBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.status !== 'Cancelled').length
  }, [bookings])

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Loading verified traveler credentials...</span>
        </div>
      </div>
    )
  }

  return (
    <div key={language} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* TOP NAVIGATION HEADER */}
      <header className="px-6 lg:px-12 py-3.5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Plane className="w-4 h-4 text-slate-950" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
            {t('brandName')}{' '}
            <span className="text-amber-400 text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
              {t('portalTag')}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors hidden sm:inline-block"
          >
            {t('home')}
          </Link>
          <Link
            to="/destinations"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors hidden sm:inline-block"
          >
            {t('navDestinations')}
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold hover:bg-purple-500/30 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{t('adminConsole')}</span>
            </Link>
          )}

          <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">
              {user?.membershipTier || 'Platinum Elite'}
            </span>
          </div>

          <LanguageSelector />

          <button
            type="button"
            onClick={handleSignOut}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10 space-y-8">
        {/* TRAVELER WELCOME & MEMBERSHIP BANNER */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-2 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                {user?.membershipTier || 'Platinum Elite Member'}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live MongoDB Session</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {user?.name ? `${t('welcomeCaptain')}, ${user.name}` : t('welcomeCaptain')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-xl">
              Account: <strong className="text-slate-100">{user?.email}</strong> • VIP Concierge Desk Active
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <Link
              to="/book"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('bookNewVoyage')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {t('switchAccount')}
            </Link>
          </div>
        </div>

        {/* NOTIFICATION FEEDBACK ALERT */}
        {actionNotice && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <X className="w-4 h-4 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* DATABASE ERROR ALERT */}
        {fetchError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {fetchError}
          </div>
        )}

        {/* 4 TRAVELER KPI METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Expeditions */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">{t('kpiActiveTrips')}</span>
              <Plane className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{activeBookingsCount}</p>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3" />
                <span>{t('activeBookingCount')}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Sovereign Miles Balance */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">{t('kpiMiles')}</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-400">{t('milesBalance')}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {t('tierAnnualRenewal')}
              </p>
            </div>
          </div>

          {/* Card 3: Saved Wishlist Retreats */}
          <div
            onClick={() => setActiveTab('wishlist')}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold group-hover:text-amber-400 transition-colors">
                {t('kpiSavedRetreats')}
              </span>
              <Heart className="w-4 h-4 text-rose-400 group-hover:fill-rose-400 transition-colors" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{wishlistIds.length}</p>
              <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                <span>View Wishlist Escapes</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </div>

          {/* Card 4: Dedicated Concierge Desk */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">{t('kpiConciergeStatus')}</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Marco Della Valle & Aura AI</p>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{t('directLineOnline')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>{t('tabBookings')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'bookings'
                  ? 'bg-slate-950 text-amber-400'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{t('tabWishlist')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'wishlist'
                  ? 'bg-slate-950 text-amber-400'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {wishlistIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('membership')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'membership'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{t('tabMembership')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('tabPreferences')}</span>
          </button>
        </div>

        {/* TAB 1: MY EXPEDITIONS & BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filter pills */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Filter status:</span>
                {['all', 'active', 'cancelled'].map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setBookingFilter(flt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                      bookingFilter === flt
                        ? 'bg-slate-800 text-amber-400 border border-amber-400/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400">
                {filteredBookings.length} itineraries displayed
              </span>
            </div>

            {/* Bookings List / Cards */}
            {isLoadingBookings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800"></div>
                ))}
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.map((booking) => {
                  const isCancelled = booking.status === 'Cancelled'
                  return (
                    <div
                      key={booking._id}
                      className={`rounded-3xl border p-6 flex flex-col justify-between space-y-5 transition-all shadow-xl ${
                        isCancelled
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Plane className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{t('nextFlight')}</span>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isCancelled
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isCancelled ? t('statusCancelled') : booking.flightStatus || t('statusActive')}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {booking.flightRoute}
                          </h3>
                          <p className="text-xs font-semibold text-amber-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{booking.destinationTitle}</span>
                          </p>
                        </div>
                      </div>

                      {/* Accommodation Details */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>{t('accommodation')}</span>
                          <span className="text-cyan-400 font-semibold">{t('hotelReserved')}</span>
                        </div>
                        <p className="font-bold text-white">{booking.accommodation}</p>
                        {booking.accommodationDetails && (
                          <p className="text-[11px] text-slate-400 font-light">
                            {booking.accommodationDetails}
                          </p>
                        )}
                      </div>

                      {/* Booking Meta & Ref */}
                      <div className="space-y-2 text-xs text-slate-400">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{booking.checkInDate || 'Flexible 2026'}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-amber-400 font-bold">
                              {booking.bookingRef}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyRef(booking.bookingRef)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title={t('copyRef')}
                            >
                              {copiedRef === booking.bookingRef ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                          <span>Concierge: {booking.assignedConcierge || 'Marco Della Valle'}</span>
                          <span className="text-emerald-400">Dedicated</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVoucher(booking)}
                          className="flex-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span className="truncate">{t('voucherBtn')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReviewBooking(booking)
                            setReviewModalOpen(true)
                          }}
                          className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title={t('reviewTripBtn')}
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{t('reviewTripBtn')}</span>
                        </button>

                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(booking._id)}
                            disabled={cancelingId === booking._id}
                            className="px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            title={t('cancelBookingBtn')}
                          >
                            {cancelingId === booking._id ? '...' : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
                <Plane className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-white">{t('emptyBookings')}</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {t('emptyBookingsSub')}
                </p>
                <Link
                  to="/#destinations"
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
                >
                  <span>{t('exploreCatalogBtn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED RETREATS & WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {t('tabWishlist')} ({wishlistDestinations.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Private sanctuaries and retreats you saved for future expeditions.
                </p>
              </div>

              <Link
                to="/destinations"
                className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Explore Sanctuaries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {wishlistDestinations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistDestinations.map((dest) => (
                  <div
                    key={dest._id}
                    className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={dest.image}
                        alt={dest.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent"></div>
                      <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-400/30">
                        {dest.tag}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWishlist(dest._id)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        title={t('removeWishlist')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-semibold">{dest.country}</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <Link
                          to={`/destinations?id=${dest._id}`}
                          className="text-base font-bold text-white hover:text-amber-400 transition-colors block"
                        >
                          {dest.title}
                        </Link>
                        {dest.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {dest.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Starting from</span>
                          <span className="text-sm font-extrabold text-amber-400">{dest.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/destinations?id=${dest._id}`}
                            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
                          >
                            Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleReserveWishlist(dest)}
                            disabled={reservingId === dest._id}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {reservingId === dest._id ? (
                              <span>Reserving...</span>
                            ) : (
                              <>
                                <span>{t('reserveWishlist')}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
                <Heart className="w-8 h-8 text-rose-400 mx-auto" />
                <h3 className="text-base font-bold text-white">{t('emptyWishlist')}</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {t('emptyWishlistSub')}
                </p>
                <Link
                  to="/#destinations"
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
                >
                  <span>{t('exploreCatalogBtn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SOVEREIGN MEMBERSHIP & PERKS */}
        {activeTab === 'membership' && (
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                WanderWave Sovereign Club
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {t('membershipTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                {t('membershipSubtitle')}
              </p>
            </div>

            {/* Sovereign Tier Status Card */}
            <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    Tier Status: {user?.membershipTier || 'Platinum Elite'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Sovereign Ambassador & Global Voyager
                </h3>
                <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                  You enjoy premier status across all private jet charters, yacht partnerships, and royal villas with priority waitlist bypass.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-center shrink-0 w-full md:w-auto">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Available Sovereign Miles</span>
                <span className="text-2xl font-black text-amber-400 block mt-1">48,500</span>
                <span className="text-[11px] text-emerald-400 font-semibold">Tier Locked through Dec 2026</span>
              </div>
            </div>

            {/* 4 Sovereign Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">{t('perk1Title')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">{t('perk1Desc')}</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">{t('perk2Title')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">{t('perk2Desc')}</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">{t('perk3Title')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">{t('perk3Desc')}</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">{t('perk4Title')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">{t('perk4Desc')}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRAVELER PREFERENCES & SECURITY */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Personalized Specifications
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {t('prefTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                {t('prefSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aviation Preferences */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Plane className="w-4 h-4" />
                  <span>{t('prefAviation')}</span>
                </div>
                <p className="text-sm font-semibold text-white">{t('prefAviationVal')}</p>
                <p className="text-xs text-slate-400">
                  Transmitted automatically to charter captains for all GVA and international flights.
                </p>
              </div>

              {/* Culinary Preferences */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('prefDiet')}</span>
                </div>
                <p className="text-sm font-semibold text-white">{t('prefDietVal')}</p>
                <p className="text-xs text-slate-400">
                  Coordinated directly with Michelin-star and private villa executive chefs prior to arrival.
                </p>
              </div>

              {/* Ground Logistics */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Compass className="w-4 h-4" />
                  <span>{t('prefChauffeur')}</span>
                </div>
                <p className="text-sm font-semibold text-white">{t('prefChauffeurVal')}</p>
                <p className="text-xs text-slate-400">
                  Private tarmac vehicle transfer awaiting beside the aircraft stairwell upon touch-down.
                </p>
              </div>

              {/* Security & Credentials */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('prefSecurity')}</span>
                </div>
                <p className="text-sm font-semibold text-white">{t('prefSecurityVal')}</p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <span>{t('securityActionBtn')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* TRAVEL VOUCHER & BOARDING PASS MODAL */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {t('voucherModalTitle')}
                  </h3>
                  <p className="text-xs text-slate-400">{t('voucherSubtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Boarding Pass Core Layout */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
              {/* Passenger & Ref */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    {t('voucherPassenger')}
                  </span>
                  <p className="text-base font-bold text-white">{user?.name || 'Authorized Voyager'}</p>
                  <p className="text-[11px] text-amber-400 font-semibold">{user?.membershipTier || 'Platinum Elite'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    {t('voucherRef')}
                  </span>
                  <p className="text-base font-mono font-bold text-amber-400">
                    {selectedVoucher.bookingRef}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold">
                    {selectedVoucher.flightStatus || 'Confirmed'}
                  </p>
                </div>
              </div>

              {/* Routing & Flight */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  {t('voucherFlight')}
                </span>
                <p className="text-lg font-black text-white">{selectedVoucher.flightRoute}</p>
                <p className="text-xs text-slate-300">
                  Terminal: Private Aviation FBO Lounge &bull; Fast-Track Customs Included
                </p>
              </div>

              {/* Accommodation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-850 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    {t('voucherAccommodation')}
                  </span>
                  <p className="font-bold text-white mt-0.5">{selectedVoucher.accommodation}</p>
                  <p className="text-[11px] text-slate-400 font-light">{selectedVoucher.accommodationDetails}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    {t('voucherCheckIn')}
                  </span>
                  <p className="font-bold text-white mt-0.5">{selectedVoucher.checkInDate || 'Scheduled 2026'}</p>
                  <p className="text-[11px] text-slate-400 font-light">Early Check-In / Late Check-Out Guaranteed</p>
                </div>
              </div>

              {/* Assigned Concierge */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('voucherConcierge')}</span>
                  <p className="font-bold text-white">{selectedVoucher.assignedConcierge || 'Marco Della Valle'}</p>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>+1 (800) 892-9283</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('printVoucher')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {t('closeVoucher')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOYAGER REVIEW & RATING MODAL */}
      {reviewModalOpen && (
        <ReviewModal
          key={selectedReviewBooking?._id || 'new-review'}
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false)
            setSelectedReviewBooking(null)
          }}
          onSuccess={() => {
            setActionNotice({
              type: 'success',
              text: t('reviewSuccessMsg'),
            })
          }}
          bookingId={selectedReviewBooking?._id}
          bookingRef={selectedReviewBooking?.bookingRef}
          bookingDetails={selectedReviewBooking}
          defaultTargetType="Package"
          defaultTargetName={selectedReviewBooking?.destinationTitle || ''}
        />
      )}

      {/* FOOTER */}
      <footer className="mt-auto py-6 px-6 lg:px-12 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>{t('footerRights')}</p>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-slate-300 transition-colors">{t('home')}</Link>
          <span>&bull;</span>
          <Link to="/#experience" className="hover:text-slate-300 transition-colors">{t('wanderwaveStandard')}</Link>
          <span>&bull;</span>
          <span className="text-emerald-400">{t('sslBadge')}</span>
        </div>
      </footer>
    </div>
  )
}
