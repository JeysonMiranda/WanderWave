import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import { authAPI } from '../services/api'
import LanguageSelector from '../components/LanguageSelector'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()

  // State management
  const [tokenStatus, setTokenStatus] = useState('verifying') // 'verifying', 'valid', 'invalid'
  const [userInfo, setUserInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Form states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Verify token on mount
  useEffect(() => {
    let isMounted = true

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setTokenStatus('invalid')
          setErrorMessage('No reset token was provided. Please request a new recovery link.')
        }
        return
      }

      try {
        const response = await authAPI.verifyResetToken(token)
        if (isMounted && response.success) {
          setTokenStatus('valid')
          setUserInfo(response.user || null)
        } else if (isMounted) {
          setTokenStatus('invalid')
          setErrorMessage(response.message || 'Reset link is invalid or has expired.')
        }
      } catch (err) {
        console.error('[Verify Token Error]:', err)
        if (isMounted) {
          setTokenStatus('invalid')
          setErrorMessage(err.message || 'Invalid or expired password reset link.')
        }
      }
    }

    checkToken()

    return () => {
      isMounted = false
    }
  }, [token])

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-800' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 10) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' }
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-amber-500' }
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength(newPassword)

  // Handle submit new password
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('The passwords you entered do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authAPI.resetPassword(token, newPassword)

      if (response.success) {
        setIsSuccess(true)
        // Store JWT token if returned so user is logged in
        if (response.token) {
          localStorage.setItem('wanderwave_token', response.token)
        }

        // Auto-redirect to dashboard/admin after 2.5 seconds
        setTimeout(() => {
          if (response.user?.role === 'admin') {
            navigate('/admin')
          } else {
            navigate('/dashboard')
          }
        }, 2200)
      } else {
        setErrorMessage(response.message || 'Failed to reset password.')
      }
    } catch (err) {
      console.error('[Reset Password Error]:', err)
      setErrorMessage(err.message || 'Error occurred while resetting password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header */}
      <header className="relative z-20 px-6 lg:px-12 py-3.5 border-b border-slate-900 bg-slate-950/70 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-amber-500 to-cyan-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
            {t('brandName')} <span className="text-amber-400 text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">{t('brandTag')}</span>
          </span>
        </Link>
        <LanguageSelector />
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="max-w-md w-full mx-auto">
          {/* VERIFYING TOKEN SPINNER */}
          {tokenStatus === 'verifying' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-2xl backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
                <KeyRound className="w-6 h-6 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-white">Validating Recovery Token</h2>
              <p className="text-xs text-slate-400">Verifying secure cryptographic signature with MongoDB...</p>
            </div>
          )}

          {/* INVALID OR EXPIRED TOKEN */}
          {tokenStatus === 'invalid' && (
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl backdrop-blur-xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white">Reset Link Invalid or Expired</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {errorMessage || 'This recovery link has expired or has already been used. Password reset tokens are valid for 30 minutes for account security.'}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-3">
                <Link
                  to="/login"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Request a New Reset Link</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          )}

          {/* VALID TOKEN & RESET FORM */}
          {tokenStatus === 'valid' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Token Verified</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Set New Password
                </h1>
                <p className="text-xs text-slate-400">
                  {userInfo ? (
                    <>Account: <strong className="text-slate-200">{userInfo.email}</strong></>
                  ) : (
                    'Enter your new credentials below to restore full account access.'
                  )}
                </p>
              </div>

              {/* SUCCESS NOTIFICATION */}
              {isSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Password Updated Successfully!</h3>
                    <p className="text-xs text-emerald-300">
                      Your database record has been updated and a verified session was generated.
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Redirecting to your dashboard in moments...
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    <span>Proceed to Dashboard Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                /* PASSWORD FORM */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* New Password Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="block text-xs font-semibold text-slate-300">
                      New Password <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="new-password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                          <div
                            className={`h-full transition-all duration-300 ${
                              strength.score >= 1 ? strength.color : 'bg-slate-800'
                            }`}
                            style={{ width: '33.33%' }}
                          />
                          <div
                            className={`h-full transition-all duration-300 ${
                              strength.score >= 2 ? strength.color : 'bg-slate-800'
                            }`}
                            style={{ width: '33.33%' }}
                          />
                          <div
                            className={`h-full transition-all duration-300 ${
                              strength.score >= 3 ? strength.color : 'bg-slate-800'
                            }`}
                            style={{ width: '33.33%' }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Security Strength</span>
                          <span className="font-semibold text-slate-200">{strength.label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-300">
                      Confirm New Password <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirm-password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Back to Login */}
                  <div className="text-center pt-2">
                    <Link
                      to="/login"
                      className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>{t('copyright')}</p>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
          <span>•</span>
          <Link to="/login" className="hover:text-slate-400 transition-colors">Sign In</Link>
          <span>•</span>
          <a href="#support" className="hover:text-slate-400 transition-colors">{t('helpdesk')}</a>
        </div>
      </footer>
    </div>
  )
}
