import { useState } from 'react'
import {
  Star,
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  MapPin,
  Building2,
  Compass,
  Car,
  Package as PackageIcon,
  CheckCircle2,
} from 'lucide-react'
import { reviewsAPI } from '../services/api'
import { useLanguage } from '../context/useLanguage'

export default function ReviewModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTargetType = 'Destination',
  defaultTargetName = '',
  defaultTargetId = '',
  bookingId = null,
  bookingRef = '',
  bookingDetails = null,
}) {
  const { t } = useLanguage()

  const getInitialTargetName = () => {
    if (defaultTargetName) return defaultTargetName
    if (bookingDetails) {
      if (defaultTargetType === 'Driver') return bookingDetails.assignedDriver || 'Jean-Luc Chauffeur Service'
      if (defaultTargetType === 'Hotel') return bookingDetails.accommodation || ''
      if (defaultTargetType === 'Guide') return bookingDetails.assignedConcierge || ''
      if (defaultTargetType === 'Destination') return bookingDetails.destinationTitle || ''
      if (defaultTargetType === 'Package') return bookingDetails.destinationTitle ? `${bookingDetails.destinationTitle} Sovereign Package` : ''
    }
    return ''
  }

  const [targetType, setTargetType] = useState(defaultTargetType)
  const [targetName, setTargetName] = useState(getInitialTargetName)
  const [targetId] = useState(defaultTargetId)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  // Sub-ratings
  const [showSubRatings, setShowSubRatings] = useState(false)
  const [hotelRating, setHotelRating] = useState(5)
  const [guideRating, setGuideRating] = useState(5)
  const [driverRating, setDriverRating] = useState(5)
  const [packageRating, setPackageRating] = useState(5)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')


  // Category change handler with smart autofill if booking is provided
  const handleCategorySelect = (cat) => {
    setTargetType(cat)
    if (bookingDetails) {
      if (cat === 'Driver') {
        setTargetName(bookingDetails.assignedDriver || 'Jean-Luc Chauffeur Service')
      } else if (cat === 'Hotel') {
        setTargetName(bookingDetails.accommodation || '')
      } else if (cat === 'Guide') {
        setTargetName(bookingDetails.assignedConcierge || '')
      } else if (cat === 'Destination') {
        setTargetName(bookingDetails.destinationTitle || '')
      } else if (cat === 'Package') {
        setTargetName(bookingDetails.destinationTitle ? `${bookingDetails.destinationTitle} Sovereign Package` : 'Sovereign Expedition Package')
      }
    }
  }

  if (!isOpen) return null

  const categories = [
    { type: 'Destination', label: t('targetDestination'), icon: MapPin },
    { type: 'Hotel', label: t('targetHotel'), icon: Building2 },
    { type: 'Guide', label: t('targetGuide'), icon: Compass },
    { type: 'Driver', label: t('targetDriver'), icon: Car },
    { type: 'Package', label: t('targetPackage'), icon: PackageIcon },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!targetName.trim()) {
      setErrorMessage(t('targetNameLabel') + ' is required')
      return
    }

    if (!comment.trim()) {
      setErrorMessage(t('reviewCommentLabel') + ' is required')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        targetType,
        targetName: targetName.trim(),
        targetId: targetId || undefined,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        bookingId: bookingId || undefined,
        subRatings: {
          hotelRating,
          guideRating,
          driverRating,
          packageRating,
        },
      }

      const res = await reviewsAPI.create(payload)

      setSuccessMessage(t('reviewSuccessMsg'))
      setTimeout(() => {
        if (onSuccess) onSuccess(res.data)
        onClose()
      }, 1200)
    } catch (err) {
      console.error('[ReviewModal] Submit error:', err)
      setErrorMessage(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reviewModalTitle"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="reviewModalTitle" className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                {t('reviewsTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('leaveReviewPrompt')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verified Trip Badge if booking linked */}
          {bookingRef && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">{t('verifiedBookingBadge')}</span>
                <span className="text-slate-400">• Ref: {bookingRef}</span>
              </div>
              <span className="text-[10px] text-amber-400/80 uppercase tracking-widest font-mono">
                {t('verifiedVoyager')}
              </span>
            </div>
          )}

          {/* 1. Category Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              {t('reviewTargetCategory')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                const isSelected = targetType === cat.type
                return (
                  <button
                    key={cat.type}
                    type="button"
                    onClick={() => handleCategorySelect(cat.type)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Target Name Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              {t('targetNameLabel')} <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder={t('targetNamePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* 3. Star Rating Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              {t('overallRatingLabel')} <span className="text-amber-400">*</span>
            </label>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} stars`}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'fill-transparent text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-xs font-bold text-amber-400">
                {rating === 5 && '⭐⭐⭐⭐⭐ 5.0 (Exceptional)'}
                {rating === 4 && '⭐⭐⭐⭐ 4.0 (Very Good)'}
                {rating === 3 && '⭐⭐⭐ 3.0 (Satisfactory)'}
                {rating === 2 && '⭐⭐ 2.0 (Fair)'}
                {rating === 1 && '⭐ 1.0 (Needs Improvement)'}
              </div>
            </div>
          </div>

          {/* 4. Review Headline / Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              {t('reviewTitleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('reviewTitlePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* 5. Review Commentary */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              {t('reviewCommentLabel')} <span className="text-amber-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('reviewCommentPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
            />
          </div>

          {/* 6. Optional Sub-Ratings Accordion */}
          <div className="border border-slate-800 rounded-2xl p-3 bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowSubRatings(!showSubRatings)}
              className="w-full flex items-center justify-between text-xs font-medium text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <span>{t('subRatingsTitle')}</span>
              <span className="text-slate-500 text-[11px]">
                {showSubRatings ? 'Hide ▲' : 'Show Details ▼'}
              </span>
            </button>

            {showSubRatings && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800">
                {/* Hotel */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[11px] text-slate-300">{t('hotelRatingLabel')}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setHotelRating(s)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            hotelRating >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guide */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[11px] text-slate-300">{t('guideRatingLabel')}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setGuideRating(s)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            guideRating >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Driver */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[11px] text-slate-300">{t('driverRatingLabel')}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDriverRating(s)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            driverRating >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Package */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[11px] text-slate-300">{t('packageRatingLabel')}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPackageRating(s)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            packageRating >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{t('submittingReview')}</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>{t('submitReviewBtn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
