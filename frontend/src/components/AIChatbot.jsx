import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  X,
  Send,
  Trash2,
  MapPin,
  ArrowRight,
  Bot,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import { chatAPI } from '../services/api'

let messageCounter = 1

function getCurrentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const DEFAULT_PROMPTS = {
  si: [
    'ආදරණීය නිවාඩු නිකේතන (Romantic)',
    'ශ්‍රී ලංකා සංචාරක තොරතුරු',
    'ඩොලර් 3,500 ට අඩු සංචාර',
    'ප්ලැටිනම් සාමාජික වරප්‍රසාද',
  ],
  ta: [
    'சிறந்த காதல் சுற்றுலா தலங்கள்',
    'இலங்கை கலாச்சார சுற்றுலா',
    '$3,500க்கு குறைவான பயணங்கள்',
    'பிளாட்டினம் உறுப்பினர் சலுகைகள்',
  ],
  en: [
    '🏝️ Best romantic getaways',
    '💰 Luxury trips under $3,500',
    '🇱🇰 Sri Lanka heritage retreat',
    '👑 What perks does Platinum Elite get?',
  ],
}

export default function AIChatbot() {
  const { language } = useLanguage()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Greetings! I am **Aura**, your private AI Luxury Travel Concierge at WanderWave. 🌟\n\nI can recommend exclusive private island villas, check live itinerary prices from our database, or curate a bespoke journey. How may I assist your wanderlust today?',
      suggestedDestinations: [],
      timestamp: '12:00',
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [customPrompts, setCustomPrompts] = useState(null)

  const activePrompts = customPrompts || DEFAULT_PROMPTS[language] || DEFAULT_PROMPTS.en

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom on message updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    }
  }, [isOpen])

  // Send message handler
  const handleSendMessage = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : inputText
    if (!query || !query.trim() || isLoading) return

    const userMessage = {
      id: `user-${++messageCounter}`,
      role: 'user',
      text: query.trim(),
      timestamp: getCurrentTime(),
    }

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    // Build conversation history for API
    const historyPayload = messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      text: m.text,
    }))

    try {
      const response = await chatAPI.sendMessage({
        message: query.trim(),
        conversationHistory: historyPayload,
        language,
      })

      if (response && response.success) {
        const assistantMessage = {
          id: `assistant-${++messageCounter}`,
          role: 'assistant',
          text: response.reply,
          suggestedDestinations: response.suggestedDestinations || [],
          timestamp: getCurrentTime(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (response.quickPrompts && response.quickPrompts.length > 0) {
          setCustomPrompts(response.quickPrompts)
        }
      } else {
        throw new Error(response.message || 'Failed to receive concierge response')
      }
    } catch (err) {
      console.error('[AIChatbot Error]:', err)
      const errorMessage = {
        id: `err-${++messageCounter}`,
        role: 'assistant',
        text: 'I apologize, but I am momentarily disconnected from the luxury concierge servers. Please ensure your backend is active on http://localhost:5000 and try again.',
        suggestedDestinations: [],
        timestamp: getCurrentTime(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Keyboard Enter key submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Clear chat conversation
  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${++messageCounter}`,
        role: 'assistant',
        text: 'Chat history cleared. How may I curate your next luxury adventure?',
        suggestedDestinations: [],
        timestamp: getCurrentTime(),
      },
    ])
  }

  // Helper to format text with simple markdown bold support
  const renderFormattedText = (rawText) => {
    if (!rawText) return null
    // Split by lines
    const lines = rawText.split('\n')
    return lines.map((line, lIndex) => {
      // Parse **bold** parts
      const parts = line.split(/(\*\*.*?\*\*)/g)
      return (
        <span key={lIndex} className="block leading-relaxed min-h-[1.25rem]">
          {parts.map((part, pIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIndex} className="font-semibold text-white">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return <span key={pIndex}>{part}</span>
          })}
        </span>
      )
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-cyan-400 p-[2px] shadow-xl shadow-amber-500/25 hover:shadow-cyan-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
            aria-label="Open AI Travel Concierge"
          >
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
              <Sparkles className="w-6 h-6 text-amber-400 group-hover:text-cyan-300 transition-colors animate-pulse" />
            </div>
          </button>

          {/* Pulsing Online Ping */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
          </span>

          {/* Tooltip Badge */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Concierge</span>
          </div>
        </div>
      )}

      {/* CHAT WINDOW DRAWER */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] rounded-3xl bg-slate-950/95 border border-slate-800 shadow-2xl shadow-black/60 backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* HEADER */}
          <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 p-[1.5px] flex items-center justify-center shadow-md">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">Aura Concierge</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Online</span>
                  <span>&bull;</span>
                  <span>Live MongoDB Sync</span>
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                </div>

                {/* SUGGESTED DESTINATIONS CARDS (Inside AI response) */}
                {msg.suggestedDestinations && msg.suggestedDestinations.length > 0 && (
                  <div className="w-full max-w-[95%] pt-1 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                      Recommended Itineraries:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.suggestedDestinations.map((dest) => (
                        <div
                          key={dest._id || dest.title}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all group"
                        >
                          <img
                            src={dest.image}
                            alt={dest.title}
                            className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                                {dest.title}
                              </h4>
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shrink-0">
                                {dest.price}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>{dest.country}</span>
                              <span className="text-slate-600">&bull;</span>
                              <span className="text-slate-500">{dest.tag}</span>
                            </p>
                            <Link
                              to={`/book?dest=${encodeURIComponent(dest._id || dest.title)}`}
                              onClick={() => setIsOpen(false)}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              <span>Reserve Itinerary</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* TYPING SPINNER INDICATOR */}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 w-fit rounded-tl-none animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-xs">Aura is consulting WanderWave journeys...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPTS CHIPS */}
          {activePrompts.length > 0 && !isLoading && (
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-900/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {activePrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-400 font-medium whitespace-nowrap transition-all cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* INPUT FORM CONTAINER */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={
                language === 'si'
                  ? 'ගමනාන්ත, මිල ගණන් ගැන අසන්න...'
                  : language === 'ta'
                  ? 'சுற்றுலா தலங்கள் பற்றி கேட்கவும்...'
                  : 'Ask Aura about villas, flights, destinations...'
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
