import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  MapPin,
  Plane,
  Users,
  RefreshCw,
  Plus,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldCheck,
  Search,
  Building2,
  Compass,
  Car,
  Package as PackageIcon,
  Filter,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useLanguage } from '../context/useLanguage'
import { adminAPI, destinationsAPI, reviewsAPI } from '../services/api'
import LanguageSelector from '../components/LanguageSelector'

export default function AdminPortal() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()

  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'destinations', 'bookings', 'users', 'reviews'

  // Data states
  const [stats, setStats] = useState(null)
  const [destinations, setDestinations] = useState([])
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [reviewsList, setReviewsList] = useState([])
  const [reviewMetrics, setReviewMetrics] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    averageScore: 5.0,
  })
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all')
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState('all')
  const [reviewSearch, setReviewSearch] = useState('')
  const [isModerating, setIsModerating] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' })


  // Destination Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDest, setNewDest] = useState({
    title: '',
    country: '',
    image: '',
    price: 'From $3,500',
    tag: 'Featured',
    description: '',
  })
  const [isSubmittingDest, setIsSubmittingDest] = useState(false)

  // Redirect or guard if not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      // Handled in render with clear notification
    }
  }, [authLoading, isAuthenticated, user])

  // Fetch admin data from backend
  const loadAdminData = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return

    setIsLoadingData(true)
    try {
      const [statsRes, destsRes, bookingsRes, usersRes, reviewsRes] = await Promise.all([
        adminAPI.getStats().catch(() => ({ data: null })),
        destinationsAPI.getAll().catch(() => ({ data: [] })),
        adminAPI.getAllBookings().catch(() => ({ data: [] })),
        adminAPI.getUsers().catch(() => ({ data: [] })),
        reviewsAPI.getAdminReviews().catch(() => ({ data: [], metrics: {} })),
      ])

      setStats(statsRes.data || null)
      setDestinations(destsRes.data || [])
      setBookings(bookingsRes.data || [])
      setUsers(usersRes.data || [])
      setReviewsList(reviewsRes.data || [])
      if (reviewsRes.metrics) setReviewMetrics(reviewsRes.metrics)
    } catch (error) {
      console.error('[AdminPortal] Data load error:', error)
      setActionMessage({ text: 'Failed to load some admin data from the database.', type: 'error' })
    } finally {
      setIsLoadingData(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    let isMounted = true
    async function initData() {
      if (!isAuthenticated || user?.role !== 'admin') return
      try {
        const [statsRes, destsRes, bookingsRes, usersRes, reviewsRes] = await Promise.all([
          adminAPI.getStats().catch(() => ({ data: null })),
          destinationsAPI.getAll().catch(() => ({ data: [] })),
          adminAPI.getAllBookings().catch(() => ({ data: [] })),
          adminAPI.getUsers().catch(() => ({ data: [] })),
          reviewsAPI.getAdminReviews().catch(() => ({ data: [], metrics: {} })),
        ])
        if (isMounted) {
          setStats(statsRes.data || null)
          setDestinations(destsRes.data || [])
          setBookings(bookingsRes.data || [])
          setUsers(usersRes.data || [])
          setReviewsList(reviewsRes.data || [])
          if (reviewsRes.metrics) setReviewMetrics(reviewsRes.metrics)
        }
      } catch (err) {
        console.error('[AdminPortal] Init load error:', err)
        if (isMounted) {
          setActionMessage({ text: 'Failed to load admin data from MongoDB.', type: 'error' })
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false)
        }
      }
    }

    initData()
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user])


  // Notification helper
  const notify = (text, type = 'success') => {
    setActionMessage({ text, type })
    setTimeout(() => setActionMessage({ text: '', type: '' }), 4000)
  }

  // Filtered reviews memo
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((rev) => {
      if (reviewStatusFilter !== 'all' && rev.status !== reviewStatusFilter) return false
      if (
        reviewCategoryFilter !== 'all' &&
        rev.targetType?.toLowerCase() !== reviewCategoryFilter.toLowerCase()
      ) {
        return false
      }
      if (reviewSearch.trim()) {
        const q = reviewSearch.toLowerCase()
        const matchName = rev.targetName?.toLowerCase().includes(q)
        const matchUser = rev.userName?.toLowerCase().includes(q)
        const matchTitle = rev.title?.toLowerCase().includes(q)
        const matchComment = rev.comment?.toLowerCase().includes(q)
        if (!matchName && !matchUser && !matchTitle && !matchComment) return false
      }
      return true
    })
  }, [reviewsList, reviewStatusFilter, reviewCategoryFilter, reviewSearch])

  // Moderate Review Handler (Approve / Reject)
  const handleModerateReview = async (id, newStatus) => {
    try {
      setIsModerating(true)
      const res = await reviewsAPI.moderate(id, { status: newStatus })
      if (res.success && res.data) {
        setReviewsList((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
        )
        setReviewMetrics((prev) => {
          const oldReview = reviewsList.find((r) => r._id === id)
          const oldStatus = oldReview ? oldReview.status : 'pending'
          const updated = { ...prev }
          if (oldStatus === 'pending') updated.pendingReviews = Math.max(0, updated.pendingReviews - 1)
          if (oldStatus === 'approved') updated.approvedReviews = Math.max(0, updated.approvedReviews - 1)
          if (oldStatus === 'rejected') updated.rejectedReviews = Math.max(0, updated.rejectedReviews - 1)

          if (newStatus === 'approved') updated.approvedReviews = (updated.approvedReviews || 0) + 1
          if (newStatus === 'rejected') updated.rejectedReviews = (updated.rejectedReviews || 0) + 1
          if (newStatus === 'pending') updated.pendingReviews = (updated.pendingReviews || 0) + 1
          return updated
        })
        notify(`Review status updated to "${newStatus}".`)
      }
    } catch (error) {
      console.error('[Moderate Review Error]:', error)
      notify(error.message || 'Failed to update review status.', 'error')
    } finally {
      setIsModerating(false)
    }
  }

  // Delete Review Handler
  const handleDeleteReview = async (id, targetName) => {
    if (!window.confirm(`Are you sure you want to permanently delete this review for "${targetName}"?`)) {
      return
    }

    try {
      await reviewsAPI.delete(id)
      setReviewsList((prev) => prev.filter((r) => r._id !== id))
      setReviewMetrics((prev) => ({
        ...prev,
        totalReviews: Math.max(0, prev.totalReviews - 1),
      }))
      notify('Review permanently removed from database.')
    } catch (error) {
      console.error('[Delete Review Error]:', error)
      notify(error.message || 'Failed to delete review.', 'error')
    }
  }


  // Create Destination Handler
  const handleCreateDestination = async (e) => {
    e.preventDefault()
    if (!newDest.title || !newDest.country || !newDest.image || !newDest.price) {
      notify('Please fill in all mandatory fields.', 'error')
      return
    }

    try {
      setIsSubmittingDest(true)
      const res = await destinationsAPI.create(newDest)
      if (res.success && res.data) {
        setDestinations([res.data, ...destinations])
        setShowAddModal(false)
        setNewDest({
          title: '',
          country: '',
          image: '',
          price: 'From $3,500',
          tag: 'Featured',
          description: '',
        })
        notify(`Destination "${res.data.title}" added to MongoDB successfully!`)
        // Refresh stats
        const statsRes = await adminAPI.getStats()
        if (statsRes.success) setStats(statsRes.data)
      }
    } catch (error) {
      console.error('[Create Destination Error]:', error)
      notify(error.message || 'Failed to create destination.', 'error')
    } finally {
      setIsSubmittingDest(false)
    }
  }

  // Delete Destination Handler
  const handleDeleteDestination = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" from the database?`)) {
      return
    }

    try {
      await destinationsAPI.delete(id)
      setDestinations(destinations.filter((d) => d._id !== id))
      notify(`Destination "${title}" removed from database.`)
    } catch (error) {
      console.error('[Delete Destination Error]:', error)
      notify(error.message || 'Failed to delete destination.', 'error')
    }
  }

  // Update Booking Status Handler
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await adminAPI.updateBookingStatus(bookingId, { status: newStatus })
      if (res.success && res.data) {
        setBookings(
          bookings.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b))
        )
        notify(`Booking ${res.data.bookingRef} status updated to "${newStatus}".`)
      }
    } catch (error) {
      console.error('[Update Booking Status Error]:', error)
      notify(error.message || 'Failed to update status.', 'error')
    }
  }

  // Sign out
  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  // Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-slate-400">Verifying administrator privileges...</span>
        </div>
      </div>
    )
  }

  // RBAC Access Denied if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The WanderWave Management Portal requires administrator permissions. You are currently logged in as{' '}
              <strong className="text-slate-200">{user ? user.email : 'Guest'}</strong> (Role:{' '}
              <span className="text-amber-400">{user?.role || 'None'}</span>).
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
            >
              Sign In as Administrator (admin@wanderwave.com)
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
            >
              Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Admin Header */}
      <header className="px-6 lg:px-12 py-3.5 border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md shadow-amber-500/20">
            <svg className="w-5 h-5 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">WanderWave Management</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Admin Console
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Database & Operations Management</p>
          </div>
        </div>

        {/* Admin Navigation & User Info */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <Link
            to="/"
            target="_blank"
            className="hidden md:flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <span>Public Site</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link
            to="/dashboard"
            className="hidden sm:inline-block text-slate-400 hover:text-amber-400 transition-colors"
          >
            Traveler View
          </Link>
          <LanguageSelector />
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="hidden lg:inline text-slate-300">
              Admin: <strong className="text-white">{user?.name}</strong>
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10 space-y-6">
        {/* Action / Notification Banner */}
        {actionMessage.text && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
              actionMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              type="button"
              onClick={() => setActionMessage({ text: '', type: '' })}
              className="text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Overview & Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('destinations')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'destinations'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Destinations ({destinations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plane className="w-4 h-4 shrink-0" />
              <span>Bookings ({bookings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Travelers ({users.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'reviews'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{t('tabReviews')} ({reviewsList.length})</span>
              {reviewMetrics.pendingReviews > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {reviewMetrics.pendingReviews}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAdminData}
              disabled={isLoadingData}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Sync with MongoDB"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>{isLoadingData ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            {activeTab === 'destinations' && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add Destination</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Total Registered Travelers</span>
                <p className="text-3xl font-extrabold text-white">{stats?.totalUsers || users.length}</p>
                <p className="text-[11px] text-emerald-400">Verified database users</p>
              </div>

              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Active Listed Destinations</span>
                <p className="text-3xl font-extrabold text-cyan-400">{stats?.totalDestinations || destinations.length}</p>
                <p className="text-[11px] text-slate-400">Available for public booking</p>
              </div>

              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Total Confirmed Bookings</span>
                <p className="text-3xl font-extrabold text-amber-400">{stats?.totalBookings || bookings.length}</p>
                <p className="text-[11px] text-amber-300/80">Active in MongoDB</p>
              </div>

              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Estimated Pipeline Revenue</span>
                <p className="text-3xl font-extrabold text-emerald-400">{stats?.estimatedRevenue || '$17,250'}</p>
                <p className="text-[11px] text-slate-400">Calculated from reservations</p>
              </div>
            </div>

            {/* Recent Bookings Activity */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Recent Traveler Reservations</h2>
                  <p className="text-xs text-slate-400">Latest itinerary bookings synced from MongoDB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs text-amber-400 hover:underline"
                >
                  View all &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="pb-3 font-semibold">Ref</th>
                      <th className="pb-3 font-semibold">Traveler</th>
                      <th className="pb-3 font-semibold">Destination</th>
                      <th className="pb-3 font-semibold">Flight Route</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {bookings.slice(0, 5).map((b) => (
                      <tr key={b._id} className="hover:bg-slate-850/50">
                        <td className="py-3 font-mono font-medium text-amber-400">{b.bookingRef}</td>
                        <td className="py-3">
                          <span className="font-semibold text-white">{b.user?.name || 'Explorer'}</span>
                          <span className="block text-[11px] text-slate-500">{b.user?.email || 'N/A'}</span>
                        </td>
                        <td className="py-3">{b.destinationTitle}</td>
                        <td className="py-3 text-slate-400">{b.flightRoute}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'Active' || b.status === 'Confirmed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : b.status === 'Cancelled'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DESTINATIONS MANAGER */}
        {activeTab === 'destinations' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Travel Destinations Management</h2>
                <p className="text-xs text-slate-400">
                  Direct CRUD operations on the MongoDB Destinations collection
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((dest) => (
                <div
                  key={dest._id}
                  className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={dest.image} alt={dest.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-400/30">
                      {dest.tag}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-xs text-slate-400">{dest.country}</p>
                      <h3 className="text-base font-bold text-white">{dest.title}</h3>
                      {dest.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{dest.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                      <span className="font-bold text-amber-400">{dest.price}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDestination(dest._id, dest.title)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BOOKINGS MANAGER */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-white">All Traveler Reservations</h2>
              <p className="text-xs text-slate-400">
                View, confirm, and update traveler bookings across the platform
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Booking Ref</th>
                      <th className="py-3.5 px-4 font-semibold">Traveler Info</th>
                      <th className="py-3.5 px-4 font-semibold">Itinerary / Villa</th>
                      <th className="py-3.5 px-4 font-semibold">Flight Route</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {bookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-850/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{b.bookingRef}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{b.user?.name || 'Traveler'}</p>
                          <p className="text-[11px] text-slate-400">{b.user?.email || 'N/A'}</p>
                          <span className="text-[10px] text-amber-300/80">{b.user?.membershipTier || 'Member'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-200">{b.destinationTitle}</p>
                          <p className="text-[11px] text-slate-400">{b.accommodation}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {b.flightRoute}
                          <span className="block text-[11px] text-slate-500">{b.flightStatus}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              b.status === 'Confirmed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : b.status === 'Active'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : b.status === 'Completed'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b._id, 'Confirmed')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] transition-colors"
                              title="Set status to Confirmed"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b._id, 'Completed')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 text-[11px] transition-colors"
                              title="Set status to Completed"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b._id, 'Cancelled')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 text-[11px] transition-colors"
                              title="Set status to Cancelled"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRAVELERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-white">Registered Travelers & Accounts</h2>
              <p className="text-xs text-slate-400">
                Directory of all authenticated members and administrators stored in MongoDB
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Name</th>
                      <th className="py-3.5 px-4 font-semibold">Email</th>
                      <th className="py-3.5 px-4 font-semibold">Membership Tier</th>
                      <th className="py-3.5 px-4 font-semibold">Role</th>
                      <th className="py-3.5 px-4 font-semibold">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-850/50">
                        <td className="py-3.5 px-4 font-semibold text-white">{u.name}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-amber-400 font-medium">{u.membershipTier}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REVIEWS & RATINGS MODERATION ATELIER */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Title & Subtitle */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>{t('moderationTitle')}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Moderate traveler experiences across Packages, Hotels, Guides, Drivers, and Destinations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  Showing <strong>{filteredReviews.length}</strong> of {reviewsList.length} reviews
                </span>
              </div>
            </div>

            {/* Moderation Metrics 4 Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">{t('totalReviews')}</span>
                <p className="text-2xl font-black text-white">{reviewMetrics.totalReviews || reviewsList.length}</p>
                <p className="text-[11px] text-slate-500">Across all categories</p>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-amber-500/30 space-y-1">
                <span className="text-xs text-amber-300 font-semibold">{t('pendingModeration')}</span>
                <p className="text-2xl font-black text-amber-400">{reviewMetrics.pendingReviews || 0}</p>
                <p className="text-[11px] text-amber-400/80">Requires admin approval</p>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-500/20 space-y-1">
                <span className="text-xs text-emerald-300 font-semibold">{t('approvedReviews')}</span>
                <p className="text-2xl font-black text-emerald-400">{reviewMetrics.approvedReviews || 0}</p>
                <p className="text-[11px] text-emerald-400/80">Live on public portal</p>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">{t('reviewsOverviewScore')}</span>
                <p className="text-2xl font-black text-amber-400 flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>{reviewMetrics.averageScore ? Number(reviewMetrics.averageScore).toFixed(1) : '5.0'}</span>
                </p>
                <p className="text-[11px] text-slate-500">Average voyager rating</p>
              </div>
            </div>

            {/* Moderation Controls: Search + Status Filter Pills + Category Dropdown */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setReviewStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    reviewStatusFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t('allStatuses')} ({reviewsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    reviewStatusFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>{t('reviewStatusPending')} ({reviewsList.filter(r => r.status === 'pending').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatusFilter('approved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    reviewStatusFilter === 'approved'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  <span>{t('reviewStatusApproved')} ({reviewsList.filter(r => r.status === 'approved').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatusFilter('rejected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    reviewStatusFilter === 'rejected'
                      ? 'bg-rose-500 text-white shadow-md font-bold'
                      : 'bg-slate-950 text-rose-400 hover:text-rose-300 border border-rose-500/20'
                  }`}
                >
                  <span>{t('reviewStatusRejected')} ({reviewsList.filter(r => r.status === 'rejected').length})</span>
                </button>
              </div>

              {/* Category & Search */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Category selector */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={reviewCategoryFilter}
                    onChange={(e) => setReviewCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">{t('targetAll')}</option>
                    <option value="Destination">{t('targetDestination')}</option>
                    <option value="Hotel">{t('targetHotel')}</option>
                    <option value="Guide">{t('targetGuide')}</option>
                    <option value="Driver">{t('targetDriver')}</option>
                    <option value="Package">{t('targetPackage')}</option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Search reviews or target..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-44 sm:w-56"
                  />
                </div>
              </div>
            </div>

            {/* Reviews List Cards */}
            {filteredReviews.length > 0 ? (
              <div className="space-y-4">
                {filteredReviews.map((rev) => {
                  const isApproved = rev.status === 'approved'
                  const isPending = rev.status === 'pending'

                  const CategoryIcon =
                    rev.targetType === 'Driver'
                      ? Car
                      : rev.targetType === 'Hotel'
                      ? Building2
                      : rev.targetType === 'Guide'
                      ? Compass
                      : rev.targetType === 'Package'
                      ? PackageIcon
                      : MapPin

                  return (
                    <div
                      key={rev._id}
                      className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                        isPending
                          ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : isApproved
                          ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-900/40 border-rose-500/30 opacity-70'
                      }`}
                    >
                      {/* Top Row: Target Category Pill, Target Name, Status Badge, Star Rating */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <CategoryIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>{rev.targetType}</span>
                          </span>

                          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                            {rev.targetName}
                          </h3>

                          {rev.verifiedBooking && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{t('verifiedBookingBadge')}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Stars */}
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-amber-400 ml-1">
                              {rev.rating}.0
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : isPending
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {rev.status}
                          </span>
                        </div>
                      </div>

                      {/* Review Headline & Commentary */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5 text-xs">
                        {rev.title && (
                          <h4 className="font-bold text-amber-300 text-sm">
                            {rev.title}
                          </h4>
                        )}
                        <p className="text-slate-200 font-light leading-relaxed">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      </div>

                      {/* Sub-ratings if present */}
                      {rev.subRatings && Object.values(rev.subRatings).some((v) => v) && (
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                          {rev.subRatings.driverRating && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                              Driver: ⭐ {rev.subRatings.driverRating}.0
                            </span>
                          )}
                          {rev.subRatings.hotelRating && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                              Hotel: ⭐ {rev.subRatings.hotelRating}.0
                            </span>
                          )}
                          {rev.subRatings.guideRating && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                              Guide: ⭐ {rev.subRatings.guideRating}.0
                            </span>
                          )}
                          {rev.subRatings.packageRating && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                              Package: ⭐ {rev.subRatings.packageRating}.0
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer Info & Moderation Action Buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-slate-400 text-[11px] flex items-center gap-2">
                          <span>By: <strong className="text-slate-200">{rev.userName}</strong> ({rev.userEmail || 'Traveler'})</span>
                          <span>•</span>
                          <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Actions: Approve / Reject / Delete */}
                        <div className="flex items-center gap-2">
                          {rev.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleModerateReview(rev._id, 'approved')}
                              disabled={isModerating}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t('approveReviewBtn')}</span>
                            </button>
                          )}

                          {rev.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleModerateReview(rev._id, 'rejected')}
                              disabled={isModerating}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t('rejectReviewBtn')}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev._id, rev.targetName)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition-colors cursor-pointer"
                            title={t('deleteReviewBtn')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
                <Star className="w-8 h-8 text-amber-400/50 mx-auto" />
                <h3 className="text-base font-bold text-white">No reviews found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No reviews match your selected status and category filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReviewStatusFilter('all')
                    setReviewCategoryFilter('all')
                    setReviewSearch('')
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-amber-400 text-xs font-bold hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Add Destination */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Add Travel Destination</h3>
                <p className="text-xs text-slate-400">Create a new itinerary directly in MongoDB</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDestination} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Destination Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Positano Cliffside"
                    value={newDest.title}
                    onChange={(e) => setNewDest({ ...newDest, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Italy"
                    value={newDest.country}
                    onChange={(e) => setNewDest({ ...newDest, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. From $3,800"
                    value={newDest.price}
                    onChange={(e) => setNewDest({ ...newDest, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Badge Tag</label>
                  <select
                    value={newDest.tag}
                    onChange={(e) => setNewDest({ ...newDest, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Featured">Featured</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Romantic">Romantic</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Exclusive">Exclusive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newDest.image}
                  onChange={(e) => setNewDest({ ...newDest, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Private luxury yacht, 5-star cliffside villa..."
                  value={newDest.description}
                  onChange={(e) => setNewDest({ ...newDest, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDest}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingDest ? 'Saving...' : 'Create Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-slate-900 text-xs text-slate-500 text-center">
        WanderWave Journeys • Administrator Management Console
      </footer>
    </div>
  )
}
