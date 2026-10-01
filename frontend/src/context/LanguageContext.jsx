import { useState, useEffect } from 'react'
import { LanguageContext } from './LanguageContextObject'
import { translations } from './translations'

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('wanderwave_lang') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('wanderwave_lang', language)
    document.documentElement.lang = language
  }, [language])

  const t = (key) => {
    return translations[language]?.[key] || translations.en?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

