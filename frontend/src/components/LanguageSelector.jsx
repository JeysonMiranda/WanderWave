import { useLanguage } from '../context/useLanguage'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'si', label: 'සිංහල', flag: '🇱🇰' },
    { code: 'ta', label: 'தமிழ்', flag: '🇱🇰' },
  ]

  return (
    <div className="inline-flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-1">
        {languages.map((item) => {
          const isActive = language === item.code
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              aria-label={`Switch language to ${item.label}`}
              aria-pressed={isActive}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span className="text-[13px] leading-none">{item.flag}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

