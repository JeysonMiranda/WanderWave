import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Lock,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Mail,
  RefreshCw,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import { useAuth } from '../context/useAuth'
import { authAPI } from '../services/api'
import LanguageSelector from '../components/LanguageSelector'

export default function Login({ initialMode = 'login' }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { login, register, isAuthenticated, user, logout } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState(initialMode) // 'login' or 'signup'

  // Forgot Password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState('request') // 'request', 'reset', 'success'
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotTokenData, setForgotTokenData] = useState(null)
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  // Clear errors when switching tabs
  const handleTabChange = (mode) => {
    setActiveTab(mode)
    setErrorMessage('')
    setLoginSuccess(false)
  }

  // If already authenticated and not recently submitted, can redirect
  useEffect(() => {
    if (isAuthenticated && !loginSuccess && user) {
      // User is already logged in
    }
  }, [isAuthenticated, loginSuccess, user])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (activeTab === 'signup' && !name.trim()) {
      setErrorMessage(t('fillAllFields'))
      return
    }

    if (!email.trim() || !password) {
      setErrorMessage(t('fillAllFields'))
      return
    }

    setIsLoading(true)

    try {
      let authRes = null
      if (activeTab === 'login') {
        authRes = await login(email.trim(), password)
      } else {
        authRes = await register(name.trim(), email.trim(), password, 'Platinum Elite')
      }

      setLoginSuccess(true)
      setTimeout(() => {
        if (authRes?.user?.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      }, 1200)
    } catch (error) {
      console.error('[Auth Submission Error]:', error)
      setErrorMessage(error.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  // Pre-fill helper for quick testing
  const fillDemoCredentials = () => {
    if (activeTab === 'signup') {
      setName('Alex Vance')
      setEmail(`traveler_${Math.floor(1000 + Math.random() * 9000)}@wanderwave.com`)
      setPassword('Adventurer2026!')
    } else {
      setEmail('demo@wanderwave.com')
      setPassword('Password123!')
    }
    setErrorMessage('')
  }

  // Pre-fill helper for admin
  const fillAdminCredentials = () => {
    setActiveTab('login')
    setEmail('admin@wanderwave.com')
    setPassword('AdminPassword2026!')
    setErrorMessage('')
  }

  const closeForgotModal = () => {
    setShowForgotPassword(false)
    setForgotStep('request')
    setForgotError('')
    setForgotTokenData(null)
    setForgotNewPassword('')
    setForgotConfirmPassword('')
  }

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return

    setForgotError('')
    setForgotLoading(true)
    try {
      const res = await authAPI.forgotPassword(forgotEmail.trim())
      if (res.success && res.resetToken) {
        setForgotTokenData(res)
        setForgotStep('reset')
      } else {
        setForgotError(res.message || 'Unable to generate password recovery link.')
      }
    } catch (error) {
      console.error('[Forgot Password Error]:', error)
      setForgotError(error.message || 'No account with that email was found in the system.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleModalResetSubmit = async (e) => {
    e.preventDefault()
    setForgotError('')

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.')
      return
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('The passwords you entered do not match.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await authAPI.resetPassword(forgotTokenData.resetToken, forgotNewPassword)
      if (res.success) {
        if (res.token) {
          localStorage.setItem('wanderwave_token', res.token)
        }
        setForgotStep('success')
        setPassword(forgotNewPassword)
        setEmail(forgotEmail)
      } else {
        setForgotError(res.message || 'Password reset failed.')
      }
    } catch (error) {
      console.error('[Modal Reset Error]:', error)
      setForgotError(error.message || 'Reset link may have expired. Please request a new one.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (forgotTokenData?.resetUrl) {
      navigator.clipboard.writeText(forgotTokenData.resetUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header with Language Selector */}
      <header className="relative z-20 px-6 lg:px-12 py-3.5 border-b border-slate-900 bg-slate-950/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-amber-500 to-cyan-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            {t('brandName')} <span className="text-amber-400 font-semibold text-xs uppercase px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">{t('brandTag')}</span>
          </span>
        </Link>

        {/* Navigation & Language Switcher */}
        <div className="flex items-center gap-3 sm:gap-5 text-xs">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors hidden sm:inline-block">
            {t('home')}
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="text-amber-400 font-semibold transition-colors">
              {t('dashboard')} ({user?.name})
            </Link>
          )}
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Travel Inspiration Showcase */}
        <div className="relative hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-slate-800/80">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 filter brightness-75"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80')`,
            }}
          ></div>
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-slate-950/40"></div>

          {/* Top Tag Inside Showcase */}
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-white font-medium border border-white/20 backdrop-blur-sm">
              {t('portalTag')}
            </span>
          </div>

          {/* Center Card */}
          <div className="relative z-10 max-w-lg space-y-6 my-auto pt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-amber-300 shadow-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span>{t('destinationTag')}</span>
            </div>

            <h1 className="text-3xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-sm xl:text-base text-slate-200 leading-relaxed font-light">
              {t('heroDesc')}
            </p>

            {/* Testimonial Snippet */}
            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-xs sm:text-sm italic text-slate-300">
                "WanderWave transformed our honeymoon trip to the Maldives into an effortless fairy tale. Every transfer, private boat, and dinner was completely seamless."
              </p>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-8 h-8 rounded-full bg-linear-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-slate-950">
                  SL
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Sophia & Liam Martinez</p>
                  <p className="text-[11px] text-slate-400">Platinum Elite Members</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Highlights */}
          <div className="relative z-10 pt-8 grid grid-cols-3 gap-6 border-t border-white/10 text-center">
            <div>
              <p className="text-2xl font-bold text-white">140+</p>
              <p className="text-xs text-slate-400">{t('statDestinations')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">98.9%</p>
              <p className="text-xs text-slate-400">{t('statSatisfaction')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">24/7</p>
              <p className="text-xs text-slate-400">{t('statConcierge')}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Real Login / Register Form */}
        <div className="col-span-1 lg:col-span-5 xl:col-span-5 flex flex-col justify-center px-6 sm:px-12 lg:px-14 py-10">
          <div className="max-w-md w-full mx-auto space-y-7">
            {/* If user is already authenticated */}
            {isAuthenticated && user && !loginSuccess && (
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-slate-300 space-y-2">
                <p>
                  Currently authenticated as <strong className="text-white">{user.name}</strong> ({user.email}) &bull;{' '}
                  <span className="uppercase text-amber-400 font-semibold">{user.role}</span>.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-3 py-1.5 rounded-lg bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin Console
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                  >
                    {t('goToDashboardNow')}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {t('signOut')}
                  </button>
                </div>
              </div>
            )}

            {/* Switch Tabs */}
            <div className="space-y-3">
              <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('signIn')}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('signup')}
                  className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('createAccount')}
                </button>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {activeTab === 'login' ? t('welcomeBack') : t('beginJourney')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {activeTab === 'login' ? t('loginSubtitle') : t('signupSubtitle')}
                </p>
              </div>
            </div>

            {/* Quick Demo Fill Helper */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">{t('quickTest')}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>{t('autofillDemo')}</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Autofill Admin</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Success State */}
            {loginSuccess ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('loginSuccessTitle')}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {t('loginSuccessDesc')}, <span className="font-semibold text-emerald-400">{user?.name || email}</span>.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {t('redirecting')}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer"
                  >
                    {t('goToDashboardNow')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Error Banner */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Real Semantic Form connected to MongoDB */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Name Input Field (Shown only in Registration mode) */}
                  {activeTab === 'signup' && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <label htmlFor="full-name" className="block text-xs font-semibold text-slate-300">
                        {t('nameLabel')} <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="full-name"
                          name="name"
                          required
                          placeholder={t('namePlaceholder')}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Input Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-300">
                      {t('emailLabel')} <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        autoComplete="username"
                        enterKeyHint="next"
                        placeholder={t('emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input Field with Toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="current-password" className="block text-xs font-semibold text-slate-300">
                        {t('passwordLabel')} <span className="text-amber-400">*</span>
                      </label>
                      {activeTab === 'login' && (
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer hover:underline"
                        >
                          {t('forgotPassword')}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="current-password"
                        name="password"
                        required
                        autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                        enterKeyHint="done"
                        placeholder={t('passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950 accent-amber-500 cursor-pointer"
                      />
                      <span>{t('rememberMe')}</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{t('verifying')}</span>
                        </>
                      ) : (
                        <>
                          <span>{activeTab === 'login' ? t('signInBtn') : t('registerBtn')}</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Trust Badges */}
                <div className="pt-4 flex items-center justify-center gap-4 text-slate-500 text-[11px]">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{t('sslBadge')}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t('iataBadge')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {forgotStep === 'request'
                      ? 'Account Recovery'
                      : forgotStep === 'reset'
                      ? 'Set New Password'
                      : 'Password Reset Complete'}
                  </h3>
                  <p className="text-[11px] text-slate-400">WanderWave Secure Password Service</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: REQUEST RECOVERY */}
            {forgotStep === 'request' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered travel account email address below. A cryptographic 30-minute password recovery token will be generated.
                </p>

                {/* Quick Autofill Helpers */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Test Autofill:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotEmail('demo@wanderwave.com')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                    >
                      Traveler (demo@wanderwave.com)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotEmail('admin@wanderwave.com')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                    >
                      Admin (admin@wanderwave.com)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-300">
                      {t('travelEmailLabel')} <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="forgot-email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="explorer@wanderwave.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {forgotLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>Generate Recovery Link</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: SET NEW PASSWORD IN-MODAL OR VIA LINK */}
            {forgotStep === 'reset' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">Reset token created for {forgotEmail}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    You can set your new password directly below, or copy the direct reset link to open in a new tab.
                  </p>
                </div>

                {/* Direct Link Share / Copy */}
                {forgotTokenData?.resetUrl && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Direct Recovery URL:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={forgotTokenData.resetUrl}
                        className="flex-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 font-mono select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>
                      <Link
                        to={`/reset-password/${forgotTokenData.resetToken}`}
                        target="_blank"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors shrink-0"
                        title="Open in new window"
                      >
                        <ExternalLink className="w-4 h-4 text-amber-400" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* In-Modal Password Form */}
                <form onSubmit={handleModalResetSubmit} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label htmlFor="modal-new-password" className="block text-xs font-semibold text-slate-300">
                      New Password <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        id="modal-new-password"
                        required
                        minLength={6}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="modal-confirm-password" className="block text-xs font-semibold text-slate-300">
                      Confirm New Password <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        id="modal-confirm-password"
                        required
                        minLength={6}
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {forgotLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating MongoDB...</span>
                        </>
                      ) : (
                        <>
                          <span>Save New Password & Sign In</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {forgotStep === 'success' && (
              <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Password Updated Successfully!</h4>
                  <p className="text-xs text-emerald-300">
                    Your password has been changed in the database.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeForgotModal()
                      navigate('/dashboard')
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Go to Traveler Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                  >
                    Close & Return to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Bottom Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>{t('copyright')}</p>
        <div className="flex items-center gap-4">
          <a href="#privacy" className="hover:text-slate-400 transition-colors">{t('privacy')}</a>
          <span>•</span>
          <a href="#terms" className="hover:text-slate-400 transition-colors">{t('terms')}</a>
          <span>•</span>
          <a href="#support" className="hover:text-slate-400 transition-colors">{t('helpdesk')}</a>
        </div>
      </footer>
    </div>
  )
}