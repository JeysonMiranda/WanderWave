import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Plane,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Award,
  PhoneCall,
  Check,
  Copy,
  Compass,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import { useAuth } from '../context/useAuth'
import { destinationsAPI, bookingsAPI } from '../services/api'
import LanguageSelector from '../components/LanguageSelector'

// Departure Private Aviation Hubs
const DEPARTURE_HUBS = [
  { id: 'GVA', label: 'Geneva Cointrin (GVA) • Jet Aviation Executive FBO', city: 'Geneva, Switzerland' },
  { id: 'LTN', label: 'London Luton (LTN) • Signature Flight Support FBO', city: 'London, UK' },
  { id: 'TEB', label: 'New York Teterboro (TEB) • Meridian Jet Center', city: 'New York, USA' },
  { id: 'ZRH', label: 'Zurich Kloten (ZRH) • Cat Aviation VIP Terminal', city: 'Zurich, Switzerland' },
  { id: 'HND', label: 'Tokyo Haneda (HND) • VIP Premier Gate', city: 'Tokyo, Japan' },
  { id: 'CMB', label: 'Colombo Bandaranaike (CMB) • Silk Route VIP Lounge', city: 'Colombo, Sri Lanka' },
]

// Aviation Classes
const FLIGHT_CLASSES = [
  { id: 'jet', label: 'Private Jet Charter (Bombardier Global 7500 / Gulfstream G650)', badge: 'Ultra-Range Private' },
  { id: 'heli', label: 'Direct Executive Rotorcraft Link (Island / Mountain Helipad)', badge: 'Scenic Transfer' },
  { id: 'first', label: 'Commercial First Class VIP Suite Transfer Link', badge: 'Commercial Partner' },
]

// Suite Categories
const SUITE_CATEGORIES = [
  { id: 'presidential', label: 'Presidential Overwater / Cliffside Suite', addPerNight: 0, desc: 'Dedicated butler, infinity plunge pool, and private sundeck.' },
  { id: 'royal', label: 'Royal Multi-Bedroom Imperial Villa', addPerNight: 1400, desc: 'Private chef kitchen, personal spa pavilion, and direct beach access.' },
  { id: 'penthouse', label: 'Master Penthouse Ocean Pavilion', addPerNight: 2200, desc: '360° panoramic views, private helipad landing rights, and vintage wine cellar.' },
]

// Curated Add-ons
const CURATED_ADDONS = [
  { id: 'catamaran', title: 'Private 60ft Catamaran Day Charter', price: 1200, desc: 'Full-day secluded island hopping with champagne lunch & snorkeling tender.' },
  { id: 'chef', title: 'Dedicated Michelin-Star Private Executive Chef', price: 850, desc: 'Daily bespoke 5-course degustation dining tailored to your palate.' },
  { id: 'helicopter', title: 'Scenic Aerial Helicopter & Glacier / Reef Landing', price: 1500, desc: 'Private aerial photography flight and remote scenic champagne landing.' },
  { id: 'tarmac', title: 'VIP Tarmac Meet & Fast-Track Customs Escort', price: 450, desc: 'Direct aircraft-to-limousine tarmac transit bypassing all airport terminals.' },
  { id: 'cellar', title: 'Vintage Rare Wine & Champagne Cellar Tasting', price: 600, desc: 'Private sommelier masterclass featuring rare vintages and artisan cheeses.' },
]

export default function Booking() {
  const navigate = useNavigate()
  const { id: paramId } = useParams()
  const [searchParams] = useSearchParams()
  const queryDest = searchParams.get('dest')

  const { t, language } = useLanguage()
  const { user, isAuthenticated } = useAuth()

  // Stepper State (1 to 4)
  const [currentStep, setCurrentStep] = useState(1)

  // Data States
  const [destinations, setDestinations] = useState([])
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true)
  const [selectedDestination, setSelectedDestination] = useState(null)

  // Step 1: Destination & Flight
  const [departureHub, setDepartureHub] = useState('GVA')
  const [flightClass, setFlightClass] = useState('Private Jet Charter')

  // Step 2: Dates & Guests
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })
  const [durationNights, setDurationNights] = useState(7)
  const [guestCount, setGuestCount] = useState(2)
  const [selectedSuite, setSelectedSuite] = useState(SUITE_CATEGORIES[0])

  // Step 3: Add-ons & Special Requests
  const [selectedAddons, setSelectedAddons] = useState(['tarmac'])
  const [specialRequests, setSpecialRequests] = useState('')

  // Step 4: Primary Voyager Details (derived with override pattern)
  const [customVoyagerName, setCustomVoyagerName] = useState(null)
  const [customVoyagerEmail, setCustomVoyagerEmail] = useState(null)
  const voyagerName = customVoyagerName !== null ? customVoyagerName : (user?.name || '')
  const voyagerEmail = customVoyagerEmail !== null ? customVoyagerEmail : (user?.email || '')
  const [voyagerPhone, setVoyagerPhone] = useState('+1 (555) 234-8900')
  const [agreedToTerms, setAgreedToTerms] = useState(true)

  // Submission & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [copiedRef, setCopiedRef] = useState(false)

  // Fetch destinations from MongoDB
  useEffect(() => {
    let isMounted = true
    async function fetchDestinations() {
      try {
        setIsLoadingDestinations(true)
        const res = await destinationsAPI.getAll()
        if (isMounted && res.success && res.data) {
          setDestinations(res.data)

          // Preselect destination from URL param or query
          const targetKey = paramId || queryDest
          if (targetKey) {
            const matched = res.data.find(
              (d) =>
                d._id === targetKey ||
                d.title.toLowerCase().includes(targetKey.toLowerCase())
            )
            if (matched) {
              setSelectedDestination(matched)
            } else if (res.data.length > 0) {
              setSelectedDestination(res.data[0])
            }
          } else if (res.data.length > 0) {
            setSelectedDestination(res.data[0])
          }
        }
      } catch (err) {
        console.error('[Booking] Error loading destinations:', err)
      } finally {
        if (isMounted) setIsLoadingDestinations(false)
      }
    }

    fetchDestinations()

    return () => {
      isMounted = false
    }
  }, [paramId, queryDest])

  // Check-out date calculation
  const checkOutDateFormatted = useMemo(() => {
    if (!checkInDate) return ''
    try {
      const d = new Date(checkInDate)
      d.setDate(d.getDate() + parseInt(durationNights, 10))
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }, [checkInDate, durationNights])

  // Add-on toggle handler
  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    )
  }

  // Cost calculation
  const costBreakdown = useMemo(() => {
    if (!selectedDestination) {
      return { base: 0, suiteAdd: 0, addonsTotal: 0, discount: 0, total: 0 }
    }

    const rawPrice = parseInt((selectedDestination.price || '').replace(/\D/g, ''), 10) || 5000
    const base = rawPrice * Math.max(1, Math.floor(guestCount / 2))
    const suiteAdd = (selectedSuite.addPerNight || 0) * (durationNights / 7)

    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const item = CURATED_ADDONS.find((a) => a.id === id)
      return sum + (item ? item.price : 0)
    }, 0)

    const subtotal = base + suiteAdd + addonsTotal
    // Platinum Elite discount (10%)
    const discount = user?.membershipTier?.includes('Platinum') ? Math.round(subtotal * 0.1) : 0
    const total = Math.max(0, subtotal - discount)

    return { base, suiteAdd, addonsTotal, discount, total }
  }, [selectedDestination, guestCount, selectedSuite, durationNights, selectedAddons, user])

  // Submit Booking to Backend
  const handleSubmitBooking = async (e) => {
    if (e) e.preventDefault()

    if (!selectedDestination) {
      setSubmissionError('Please select a destination sanctuary.')
      return
    }

    if (!isAuthenticated) {
      // Store current reservation progress in localStorage and navigate to login
      localStorage.setItem('wanderwave_pending_booking', JSON.stringify({
        destinationId: selectedDestination._id,
        checkInDate,
        durationNights,
        guestCount,
      }))
      navigate('/login?redirect=/book')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmissionError('')

      const hubObj = DEPARTURE_HUBS.find((h) => h.id === departureHub)
      const hubLabel = hubObj ? hubObj.label : 'Geneva (GVA) FBO'

      const payload = {
        destinationTitle: `${selectedDestination.title}, ${selectedDestination.country}`,
        flightRoute: `${hubLabel} → ${selectedDestination.country} Private Charter`,
        accommodation: `${selectedDestination.title} Sanctuary Estate`,
        accommodationDetails: `${selectedSuite.label} • ${durationNights} Nights • ${guestCount} Guests • Private Butler`,
        checkInDate,
        guests: guestCount,
        totalPrice: `$${costBreakdown.total.toLocaleString()}`,
        specialRequests,
        addons: selectedAddons,
        flightClass,
        durationNights,
        primaryVoyager: {
          name: voyagerName || user.name,
          email: voyagerEmail || user.email,
          phone: voyagerPhone,
        },
      }

      const res = await bookingsAPI.create(payload)
      if (res.success && res.data) {
        setConfirmedBooking(res.data)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      console.error('[Booking Submission Error]:', err)
      setSubmissionError(err.message || 'Failed to dispatch reservation. Please verify server connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copy reference code
  const handleCopyRef = (ref) => {
    navigator.clipboard.writeText(ref)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  // SUCCESS CONFIRMATION VIEW
  if (confirmedBooking) {
    return (
      <div key={language} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        <header className="px-6 lg:px-12 py-3.5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center shadow-md">
              <Plane className="w-4 h-4 text-slate-950" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">{t('brandName')}</span>
          </Link>
          <LanguageSelector />
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Sovereign Manifest Confirmed
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {t('bookingSuccessHeading')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              {t('bookingSuccessSubtitle')}
            </p>
          </div>

          {/* Boarding Pass Summary Card */}
          <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">{t('bookingReferenceLabel')}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-mono font-black text-amber-400">{confirmedBooking.bookingRef}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyRef(confirmedBooking.bookingRef)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Copy Reference"
                  >
                    {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Total Investment</span>
                <span className="text-2xl font-black text-white block mt-1">{confirmedBooking.totalPrice || `$${costBreakdown.total.toLocaleString()}`}</span>
                <span className="text-[11px] text-emerald-400 font-semibold">100% Guaranteed Protection</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Flight Routing</span>
                <p className="font-bold text-white text-sm">{confirmedBooking.flightRoute}</p>
                <p className="text-slate-400 text-[11px]">{flightClass}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Sanctuary Estate</span>
                <p className="font-bold text-white text-sm">{confirmedBooking.accommodation}</p>
                <p className="text-slate-400 text-[11px]">{confirmedBooking.accommodationDetails}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white">Assigned Concierge: Marco Della Valle</p>
                  <p className="text-slate-400 text-[11px]">Direct priority line will contact you within 2 hours.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-amber-400 font-semibold">
                <PhoneCall className="w-4 h-4" />
                <span>+1 (800) 892-9283</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{t('viewInDashboardBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-colors"
            >
              {t('exploreMoreBtn')}
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div key={language} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* TOP STICKY NAVBAR */}
      <header className="px-6 lg:px-12 py-3.5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Plane className="w-4 h-4 text-slate-950" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
            {t('brandName')}{' '}
            <span className="text-amber-400 text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
              Booking Atelier
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5 text-xs font-medium">
          <Link to="/" className="text-slate-300 hover:text-white transition-colors hidden sm:inline-block">
            {t('home')}
          </Link>
          <Link to="/destinations" className="text-slate-300 hover:text-white transition-colors hidden sm:inline-block">
            {t('navDestinations')}
          </Link>
          <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
            {t('dashboard')}
          </Link>
          <LanguageSelector />
          {!isAuthenticated && (
            <Link
              to="/login?redirect=/book"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {t('signIn')}
            </Link>
          )}
        </div>
      </header>

      {/* HERO STUDIO HEADER */}
      <section className="px-6 lg:px-12 pt-10 pb-6 max-w-7xl mx-auto w-full space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
            {t('bookingStudioTag')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {t('bookingStudioTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t('bookingStudioSubtitle')}
          </p>
        </div>

        {/* STEPPER NAVIGATION BAR */}
        <div className="pt-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { num: 1, label: t('bookingStep1'), icon: MapPin },
              { num: 2, label: t('bookingStep2'), icon: Calendar },
              { num: 3, label: t('bookingStep3'), icon: Sparkles },
              { num: 4, label: t('bookingStep4'), icon: ShieldCheck },
            ].map((s) => {
              const Icon = s.icon
              const isActive = currentStep === s.num
              const isPast = currentStep > s.num

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10'
                      : isPast
                      ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : isPast
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] uppercase tracking-wider block opacity-75">Step 0{s.num}</span>
                    <span className="text-xs font-bold text-white truncate block">{s.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ERROR NOTICE BANNER */}
      {submissionError && (
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {submissionError}
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA: FORM + REAL-TIME INVESTMENT SUMMARY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT / CENTER: STEP FORM CONTENT (Col Span 2) */}
        <div className="lg:col-span-2 space-y-8 bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          {/* STEP 1: DESTINATION & AVIATION LINK */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <span>{t('selectDestinationTitle')}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">{t('selectDestinationSub')}</p>
              </div>

              {/* Destination Selector Grid */}
              {isLoadingDestinations ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-44 bg-slate-800/50 rounded-2xl"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {destinations.map((dest) => {
                    const isSelected = selectedDestination?._id === dest._id
                    return (
                      <div
                        key={dest._id}
                        onClick={() => setSelectedDestination(dest)}
                        className={`rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-950/80 border-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={dest.image}
                            alt={dest.title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                              {dest.tag}
                            </span>
                            <h3 className="text-sm font-bold text-white truncate">{dest.title}</h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Compass className="w-3 h-3 text-cyan-400" />
                              <span>{dest.country}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs">
                          <span className="text-slate-500 text-[10px] uppercase">Starting Package</span>
                          <span className="font-extrabold text-amber-400">{dest.price}</span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Departure Hub & Flight Class */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Plane className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('departureHubLabel')}</span>
                  </label>
                  <select
                    value={departureHub}
                    onChange={(e) => setDepartureHub(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {DEPARTURE_HUBS.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('flightClassLabel')}</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {FLIGHT_CLASSES.map((fc) => (
                      <button
                        key={fc.id}
                        type="button"
                        onClick={() => setFlightClass(fc.label)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          flightClass === fc.label
                            ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] text-amber-400 block font-semibold">{fc.badge}</span>
                        <span className="text-xs mt-0.5 block leading-tight">{fc.label.split('(')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATES, DURATION & GUEST SPECIFICATION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Configure Travel Dates & Sanctuary Suite</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Private itineraries include guaranteed early arrivals and extended late check-outs.
                </p>
              </div>

              {/* Check-In Date & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    {t('checkInDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  />
                  {checkOutDateFormatted && (
                    <span className="text-[11px] text-emerald-400 mt-1.5 block">
                      Scheduled Departure: {checkOutDateFormatted}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    {t('durationLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { days: 7, label: '7 Nights' },
                      { days: 10, label: '10 Nights' },
                      { days: 14, label: '14 Nights' },
                    ].map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setDurationNights(opt.days)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          durationNights === opt.days
                            ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Guest Count Counter */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('guestsCountLabel')}
                </label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-850">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{guestCount} Adult Voyagers</p>
                    <p className="text-xs text-slate-400">All private jet manifests and villa amenities configured accordingly.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={guestCount <= 1}
                      onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                      className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-amber-400 text-base">{guestCount}</span>
                    <button
                      type="button"
                      disabled={guestCount >= 10}
                      onClick={() => setGuestCount((g) => Math.min(10, g + 1))}
                      className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Suite Selection */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-300 block">
                  {t('suiteCategoryLabel')}
                </label>
                <div className="space-y-2.5">
                  {SUITE_CATEGORIES.map((cat) => {
                    const isSelected = selectedSuite.id === cat.id
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedSuite(cat)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 shadow-md'
                            : 'bg-slate-950 border-slate-850 hover:border-slate-750'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{cat.label}</span>
                            {cat.addPerNight > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-semibold">
                                +${cat.addPerNight}/night
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-light">{cat.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BESPOKE ADD-ONS & CURATIONS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{t('curatedAddonsTitle')}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">{t('curatedAddonsSub')}</p>
              </div>

              {/* Add-ons List */}
              <div className="space-y-3">
                {CURATED_ADDONS.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id)
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500 shadow-md'
                          : 'bg-slate-950 border-slate-850 hover:border-slate-750'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{addon.title}</h4>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            +${addon.price}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-light leading-relaxed">{addon.desc}</p>
                      </div>

                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Special Requests / Dietary Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block">
                  {t('specialRequestsLabel')}
                </label>
                <textarea
                  rows="3"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder={t('specialRequestsPlaceholder')}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
                ></textarea>
              </div>
            </div>
          )}

          {/* STEP 4: PRIMARY VOYAGER DETAILS & CONFIRMATION */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>{t('voyagerDetailsTitle')}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">{t('voyagerDetailsSub')}</p>
              </div>

              {/* Voyager Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('nameLabel')}</label>
                  <input
                    type="text"
                    required
                    value={voyagerName}
                    onChange={(e) => setCustomVoyagerName(e.target.value)}
                    placeholder="Lord Alistair Sterling"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('emailLabel')}</label>
                  <input
                    type="email"
                    required
                    value={voyagerEmail}
                    onChange={(e) => setCustomVoyagerEmail(e.target.value)}
                    placeholder="voyager@wanderwave.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Direct Mobile (Concierge SMS/WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={voyagerPhone}
                    onChange={(e) => setVoyagerPhone(e.target.value)}
                    placeholder="+1 (800) 892-9283"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Passport Issuing Country</label>
                  <input
                    type="text"
                    defaultValue="Switzerland / Diplomatic"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Sovereign Privilege Perks Applied */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Sovereign Membership Privileges Applied</span>
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Complimentary luxury tarmac transfer, zero cancellation penalty up to 48 hours prior, and dedicated personal journey designer.
                </p>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span className="leading-relaxed">{t('termsAgreement')}</span>
              </label>
            </div>
          )}

          {/* STEP CONTROLLER BUTTONS */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('stepBack')}</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t('stepNext')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !agreedToTerms}
                onClick={handleSubmitBooking}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{t('bookingProcessing')}</span>
                ) : (
                  <>
                    <span>{t('confirmReservationBtn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: STICKY REAL-TIME EXPEDITION INVESTMENT SUMMARY (Col Span 1) */}
        <aside className="sticky top-20 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('summaryTitle')}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Live Calculation
            </span>
          </div>

          {/* Selected Destination Card */}
          {selectedDestination ? (
            <div className="space-y-3">
              <div className="relative h-28 rounded-2xl overflow-hidden">
                <img
                  src={selectedDestination.image}
                  alt={selectedDestination.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent"></div>
                <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-400 border border-amber-400/20">
                  {selectedDestination.tag}
                </span>
                <span className="absolute bottom-2 left-2 font-bold text-white text-xs">
                  {selectedDestination.title}
                </span>
              </div>

              {/* Itinerary Specs */}
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>{t('summaryFlight')}</span>
                  <span className="font-semibold text-white truncate max-w-[150px]">{departureHub} → {selectedDestination.country}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('summarySchedule')}</span>
                  <span className="font-semibold text-white">{durationNights} Nights • {checkInDate || '2026'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('summaryGuests')}</span>
                  <span className="font-semibold text-white">{guestCount} Voyagers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('summarySuite')}</span>
                  <span className="font-semibold text-amber-400">{selectedSuite.label.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No destination selected yet.</p>
          )}

          {/* Itemized Pricing */}
          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>{t('summaryBasePrice')}</span>
              <span className="font-bold text-white">${costBreakdown.base.toLocaleString()}</span>
            </div>

            {costBreakdown.suiteAdd > 0 && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Suite Upgrade</span>
                <span className="font-bold text-white">+${costBreakdown.suiteAdd.toLocaleString()}</span>
              </div>
            )}

            {costBreakdown.addonsTotal > 0 && (
              <div className="flex items-center justify-between text-slate-400">
                <span>{t('summaryAddons')}</span>
                <span className="font-bold text-white">+${costBreakdown.addonsTotal.toLocaleString()}</span>
              </div>
            )}

            {costBreakdown.discount > 0 && (
              <div className="flex items-center justify-between text-emerald-400">
                <span>{t('summaryMemberCredit')}</span>
                <span className="font-bold">-${costBreakdown.discount.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">{t('summaryTotal')}</span>
                <span className="text-xl font-black text-amber-400">${costBreakdown.total.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-slate-500">All Taxes & Transfers</span>
            </div>
          </div>

          {/* Security Safeguards */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 space-y-1.5 text-[11px] text-slate-400">
            <p className="flex items-center gap-1.5 text-white font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sovereign Guarantee Protection</span>
            </p>
            <p>100% full refund or date flexibility up to 48 hours prior to charter departure.</p>
          </div>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto py-6 px-6 lg:px-12 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>{t('footerRights')}</p>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-slate-300 transition-colors">{t('home')}</Link>
          <span>&bull;</span>
          <Link to="/#destinations" className="hover:text-slate-300 transition-colors">{t('navItineraries')}</Link>
          <span>&bull;</span>
          <span className="text-emerald-400">{t('sslBadge')}</span>
        </div>
      </footer>
    </div>
  )
}
