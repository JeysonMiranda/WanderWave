import Destination from '../models/Destination.js'

// Parse numerical dollar value from price string like "From $3,650"
function parsePrice(priceStr) {
  if (!priceStr) return 0
  const match = priceStr.replace(/,/g, '').match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

export const processChatMessage = async ({ message, conversationHistory = [], language = 'en' }) => {
  if (!message || typeof message !== 'string') {
    throw new Error('Message text is required')
  }

  const userQuery = message.trim()
  const lowerQuery = userQuery.toLowerCase()

  // 1. Fetch live destinations from MongoDB for real-time awareness
  const allDestinations = await Destination.find().sort({ createdAt: -1 })

  // Check if Gemini API Key is configured in environment
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (geminiApiKey) {
    try {
      const geminiResult = await callGeminiAPI({
        apiKey: geminiApiKey,
        userQuery,
        conversationHistory,
        language,
        destinations: allDestinations,
      })
      if (geminiResult && geminiResult.reply) {
        return geminiResult
      }
    } catch (err) {
      console.warn('[AIChatService] Gemini API call failed or timed out. Falling back to native concierge engine:', err.message)
    }
  }

  // 2. Native WanderWave Travel Concierge NLP Engine (Offline / Standalone mode)
  return runNativeTravelEngine({
    query: userQuery,
    lower: lowerQuery,
    destinations: allDestinations,
    language,
  })
}

// Google Gemini API caller
async function callGeminiAPI({ apiKey, userQuery, conversationHistory, language, destinations }) {
  const destListSummary = destinations
    .map((d) => `- ${d.title} (${d.country}) | Price: ${d.price} | Category: ${d.tag} | ID: ${d._id}`)
    .join('\n')

  const systemInstruction = `You are Aura, the premier AI Luxury Travel Concierge for WanderWave Journeys.
You speak with elegance, warmth, and deep travel expertise.
WanderWave offers ultra-exclusive bespoke flights, private island charters, and five-star villa stays across the world.

Here is the current live destinations inventory from WanderWave's database:
${destListSummary}

Guidelines:
1. Always recommend 1 to 3 relevant destinations from the catalog when answering destination, vacation, or budget questions.
2. If the user asks in Sinhala, respond fluently in Sinhala (සිංහල).
3. If the user asks in Tamil, respond fluently in Tamil (தமிழ்).
4. Keep responses engaging, structured (use bullet points or bold text), and concise (2-4 paragraphs).
5. At the very end of your response, if you recommend any destinations from the list, append a single JSON line formatted like:
[[DESTINATIONS: "Title 1", "Title 2"]]
`

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemInstruction }],
    },
    {
      role: 'model',
      parts: [{ text: 'Understood. I am Aura, your WanderWave luxury travel concierge. How may I assist your voyage today?' }],
    },
  ]

  // Add recent conversation history (up to last 6 messages)
  if (Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory.slice(-6)) {
      if (msg.role && msg.text) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })
      }
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: `User query (Preferred language: ${language}): ${userQuery}` }],
  })

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`)
  }

  const data = await response.json()
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extract recommended destination titles from [[DESTINATIONS: ...]] tag if present
  let suggestedDestinations = []
  const destMatch = rawText.match(/\[\[DESTINATIONS:\s*(.+?)\]\]/)
  let cleanReply = rawText

  if (destMatch) {
    cleanReply = rawText.replace(destMatch[0], '').trim()
    const titles = destMatch[1]
      .split(',')
      .map((t) => t.replace(/["'[\]]/g, '').trim())
      .filter(Boolean)

    suggestedDestinations = destinations.filter((d) =>
      titles.some((title) => d.title.toLowerCase().includes(title.toLowerCase()))
    )
  }

  // Fallback: match by title mention in response
  if (suggestedDestinations.length === 0) {
    suggestedDestinations = destinations
      .filter((d) => cleanReply.toLowerCase().includes(d.title.toLowerCase()) || cleanReply.toLowerCase().includes(d.country.toLowerCase()))
      .slice(0, 3)
  }

  return {
    success: true,
    reply: cleanReply,
    suggestedDestinations,
    quickPrompts: getFollowUpPrompts(suggestedDestinations, language),
    detectedIntent: 'gemini_generative',
  }
}

// Built-in Native NLP Travel Concierge Engine
function runNativeTravelEngine({ query, lower, destinations, language }) {
  // Check for multilingual greeting in Sinhala
  const isSinhala = language === 'si' || /ආයුබෝවන්|සුබ|සංචාර|මිල|කොහොමද|ස්තූතියි|ලංකා/.test(query)
  // Check for multilingual greeting in Tamil
  const isTamil = language === 'ta' || /வணக்கம்|சுற்றுலா|பயணம்|விலை|நன்றி|இலங்கை/.test(query)

  // 1. GREETING INTENT
  if (
    /^(hi|hello|hey|greetings|hola|good\s*(morning|evening|afternoon)|who are you|what can you do)/i.test(lower) ||
    /^(ආයුබෝවන්|සුබ දවසක්|සුබ උදෑසනක්|හෙලෝ)/.test(query.trim()) ||
    /^(வணக்கம்|காலை வணக்கம்|ஹலோ)/.test(query.trim())
  ) {
    if (isSinhala) {
      return {
        success: true,
        reply: `ආයුබෝවන්! මම **Aura**, ඔබගේ WanderWave සුඛෝපභෝගී සංචාරක AI සහයකයා. ✨
ලොව ප්‍රමුඛතම සංචාරක ගමනාන්ත, පෞද්ගලික ගුවන් ගමන්, සහ තරු පහේ විලා වෙන්කිරීම් පිළිබඳව ඔබට මගපෙන්වීමට මම සූදානම්. 

අද ඔබට ගවේෂණය කිරීමට අවශ්‍ය කුමන ආකාරයේ සංචාරයක්ද?`,
        suggestedDestinations: destinations.slice(0, 2),
        quickPrompts: [
          'ආදරණීය නිවාඩු නිකේතන (Romantic)',
          'ඇඩ්වෙන්චර් සංචාර (Adventure)',
          'ඩොලර් 3,500 ට අඩු සංචාර',
        ],
        detectedIntent: 'greeting',
      }
    }

    if (isTamil) {
      return {
        success: true,
        reply: `வணக்கம்! நான் **Aura**, உங்கள் WanderWave சொகுசு பயண AI ஆலோசகர். ✨
உலகின் மிகச் சிறந்த சுற்றுலா தலங்கள், தனியார் விமானங்கள், மற்றும் ஐந்து நட்சத்திர வில்லா முன்பதிவுகள் பற்றி உங்களுக்கு உதவ நான் தயாராக உள்ளேன்.

நீங்கள் எந்த வகையான பயணத்தை ஆராய விரும்புகிறீர்கள்?`,
        suggestedDestinations: destinations.slice(0, 2),
        quickPrompts: [
          'காதல் சுற்றுலா தலங்கள் (Romantic)',
          'சாகசப் பயணங்கள் (Adventure)',
          '$3,500க்கு குறைவான திட்டங்கள்',
        ],
        detectedIntent: 'greeting',
      }
    }

    return {
      success: true,
      reply: `Greetings! I am **Aura**, your dedicated WanderWave AI Luxury Travel Concierge. 🌟

I can help you curate bespoke itineraries, discover hidden gems across our **${destinations.length}+ curated destinations**, provide pricing breakdowns, and assist with bookings.

What kind of unforgettable voyage can I assist you with today?`,
      suggestedDestinations: destinations.slice(0, 2),
      quickPrompts: [
        '🏝️ Romantic getaways & honeymoons',
        '💰 Journeys under $3,500',
        '🏔️ Alpine & adventure expeditions',
        '🇱🇰 Sri Lanka heritage retreat',
      ],
      detectedIntent: 'greeting',
    }
  }

  // 2. SPECIFIC DESTINATION LOOKUP (Capri, Amalfi, Sigiriya, Kyoto, Monaco, Bora Bora, Switzerland, Sri Lanka)
  const matchedDest = destinations.find((d) => {
    const t = d.title.toLowerCase()
    const c = d.country.toLowerCase()
    const qLower = lower

    if (c === 'sri lanka' && (qLower.includes('sri lanka') || query.includes('ශ්‍රී ලංකා') || query.includes('ලංකාව') || query.includes('ලංකා') || query.includes('இலங்கை'))) {
      return true
    }
    if (c === 'japan' && (qLower.includes('japan') || qLower.includes('kyoto') || query.includes('ජපාන') || query.includes('ஜப்பான்'))) {
      return true
    }
    if (c === 'italy' && (qLower.includes('italy') || qLower.includes('amalfi') || qLower.includes('capri') || query.includes('ඉතාලි') || query.includes('இத்தாலி'))) {
      return true
    }
    if (c === 'greece' && (qLower.includes('greece') || qLower.includes('santorini') || query.includes('ග්‍රීස') || query.includes('கிரீஸ்'))) {
      return true
    }
    if (c === 'monaco' && (qLower.includes('monaco') || qLower.includes('monte carlo') || query.includes('මොනාකෝ'))) {
      return true
    }
    if (c === 'switzerland' && (qLower.includes('swiss') || qLower.includes('switzerland') || qLower.includes('alps') || query.includes('ස්විස්'))) {
      return true
    }
    if (d.title.toLowerCase().includes('bora') && (qLower.includes('bora') || qLower.includes('polynesia'))) {
      return true
    }
    return qLower.includes(t) || qLower.includes(c) || t.split(' ').some((word) => word.length > 3 && qLower.includes(word))
  })

  if (matchedDest) {
    let reply = ''
    if (isSinhala) {
      reply = `**${matchedDest.title}** (${matchedDest.country}) යනු WanderWave හි වඩාත් ප්‍රිය කරන ලද ගමනාන්තයකි! ✨\n\n- **වර්ගය**: ${matchedDest.tag}\n- **ආරම්භක මිල**: ${matchedDest.price}\n- **විශේෂත්වය**: ${matchedDest.description}\n\nමෙම චාරිකාව සඳහා පෞද්ගලික මගපෙන්වන්නන් සහ සුවිශේෂී නවාතැන් පහසුකම් ඇතුළත් වේ.`
    } else if (isTamil) {
      reply = `**${matchedDest.title}** (${matchedDest.country}) என்பது WanderWave இன் மிகவும் பிரபலமான இடமாகும்! ✨\n\n- **பிரிவு**: ${matchedDest.tag}\n- **தொடக்க விலை**: ${matchedDest.price}\n- **விவரம்**: ${matchedDest.description}\n\nஇந்த பயணத்தில் பிரத்யேக படகு சவாரிகள் மற்றும் சொகுசு தங்குமிடங்கள் அடங்கும்.`
    } else {
      reply = `**${matchedDest.title}** in ${matchedDest.country} is one of our master journey designer highlights! ✨

- **Category / Style**: ${matchedDest.tag}
- **Pricing**: ${matchedDest.price}
- **Experience**: ${matchedDest.description}

Every booking includes private transfer options, five-star boutique villa suites, and personalized 24/7 concierge assistance.`
    }

    return {
      success: true,
      reply,
      suggestedDestinations: [matchedDest],
      quickPrompts: [
        `How do I book ${matchedDest.title}?`,
        'What other places are similar?',
        'Show me trips under $3,500',
      ],
      detectedIntent: 'destination_detail',
    }
  }

  // 3. BUDGET & PRICE INQUIRY (under $3000, under $3500, cheap, luxury, expensive)
  if (/budget|cheap|afford|under\s*\$?\d+|price|cost|how much|dollar|\$/i.test(lower)) {
    // Check for target price limit
    const numMatch = lower.match(/under\s*\$?(\d+)/i) || lower.match(/\$?(\d{3,4})/)
    let maxPrice = 3500
    if (numMatch) {
      maxPrice = parseInt(numMatch[1], 10)
    }

    const affordableDestinations = destinations.filter((d) => {
      const price = parsePrice(d.price)
      return price > 0 && price <= (maxPrice > 1000 ? maxPrice : 3500)
    })

    const selected = affordableDestinations.length > 0 ? affordableDestinations : destinations.slice(0, 3)

    let reply = `Here are our top luxury options tailored for a budget around **$${maxPrice.toLocaleString()}**:\n\n`
    selected.forEach((d) => {
      reply += `• **${d.title}** (${d.country}) — **${d.price}** (${d.tag})\n`
    })
    reply += `\nAll packages include five-star accommodations, private transfers, and concierge privileges.`

    return {
      success: true,
      reply,
      suggestedDestinations: selected,
      quickPrompts: [
        'Tell me more about the lowest price package',
        'What does Platinum Elite include?',
        'Can I customize flight times?',
      ],
      detectedIntent: 'budget_filter',
    }
  }

  // 4. STYLE & CATEGORY (Romantic, Honeymoon, Adventure, Heritage, Beach, Mountain)
  if (/romantic|honeymoon|couple|love|anniversary/i.test(lower)) {
    const romantic = destinations.filter((d) =>
      d.tag.toLowerCase().includes('romantic') ||
      d.title.toLowerCase().includes('santorini') ||
      d.title.toLowerCase().includes('amalfi') ||
      d.title.toLowerCase().includes('bora')
    )
    const list = romantic.length > 0 ? romantic : destinations.slice(0, 2)

    return {
      success: true,
      reply: `For couples and honeymoons, nothing rivals our romantic private escapes! 🥂✨

I especially recommend **Santorini Caldera Suites** or **Bora Bora Overwater Villas** for serene sunsets, private infinity pools, and catamaran dinners under the stars.`,
      suggestedDestinations: list,
      quickPrompts: [
        'Tell me about Bora Bora villas',
        'Santorini Caldera Suites details',
        'Book a honeymoon package',
      ],
      detectedIntent: 'style_romantic',
    }
  }

  if (/adventure|hike|mountain|glacier|safari|nature|alps/i.test(lower)) {
    const adventure = destinations.filter((d) =>
      d.tag.toLowerCase().includes('adventure') ||
      d.title.toLowerCase().includes('swiss') ||
      d.country.toLowerCase().includes('switzerland')
    )
    const list = adventure.length > 0 ? adventure : destinations.slice(0, 2)

    return {
      success: true,
      reply: `For breathtaking peaks and high-adrenaline expeditions, **Swiss Alpine Expeditions** offers private helicopter glacier transfers, panoramic cogwheel train journeys, and secluded luxury chalet retreats. 🏔️🎿`,
      suggestedDestinations: list,
      quickPrompts: [
        'Swiss Alpine Expeditions pricing',
        'What gear is included?',
        'Other mountain destinations',
      ],
      detectedIntent: 'style_adventure',
    }
  }

  if (/heritage|culture|history|temple|japan|sri lanka/i.test(lower)) {
    const cultural = destinations.filter((d) =>
      d.tag.toLowerCase().includes('heritage') ||
      d.tag.toLowerCase().includes('cultural') ||
      d.country.toLowerCase().includes('sri lanka') ||
      d.country.toLowerCase().includes('japan')
    )
    const list = cultural.length > 0 ? cultural : destinations.slice(0, 2)

    return {
      success: true,
      reply: `Our cultural expeditions blend timeless heritage with unparalleled luxury:

• **Sigiriya & Tea Country Heritage (Sri Lanka)**: UNESCO ancient fortress villas and Ceylon high-tea estate trails.
• **Kyoto Imperial Gardens (Japan)**: Private tea ceremonies, historical ryokans, and tranquil bamboo shrines. ⛩️🌿`,
      suggestedDestinations: list,
      quickPrompts: [
        'Tell me more about Sigiriya Sri Lanka',
        'Tell me about Kyoto Japan ryokans',
        'How do I book cultural tours?',
      ],
      detectedIntent: 'style_heritage',
    }
  }

  // 5. MEMBERSHIP & BENEFITS
  if (/member|tier|platinum|gold|elite|points|benefit|perk/i.test(lower)) {
    return {
      success: true,
      reply: `WanderWave offers three distinguished membership tiers:

1. **Standard Explorer**: Complimentary welcome booking, real-time itinerary updates, and dedicated 24/7 helpdesk.
2. **Gold Voyager**: Priority flight seat selection, 10% boutique dining savings, and flexible rebooking.
3. **Platinum Elite**: Unlimited private catamaran vouchers, private villa upgrade eligibility, complimentary airport helicopter transfers, and dedicated Journey Concierge access. 👑`,
      suggestedDestinations: destinations.slice(0, 2),
      quickPrompts: [
        'How do I upgrade to Platinum Elite?',
        'Show featured destinations',
        'Go to my dashboard',
      ],
      detectedIntent: 'membership_inquiry',
    }
  }

  // 6. BOOKING ASSISTANCE
  if (/book|reserve|reservation|order|buy|payment|how to/i.test(lower)) {
    return {
      success: true,
      reply: `Reserving your next luxury journey is completely seamless:

1. Browse our live catalog on the **Home** page or request a destination here in chat.
2. Click **Reserve** on any destination card to review package inclusions and dates.
3. Once logged in, your reservation is instantly saved in your MongoDB **Traveler Dashboard** with confirmed status and real-time itinerary alerts! ✈️`,
      suggestedDestinations: destinations.slice(0, 2),
      quickPrompts: [
        'Show all destinations',
        'Take me to Login',
        'Speak with a travel agent',
      ],
      detectedIntent: 'booking_process',
    }
  }

  // 7. DEFAULT CONVERSATIONAL RESPONSE
  return {
    success: true,
    reply: `I would be delighted to help you explore that! We currently have **${destinations.length} bespoke luxury destinations** loaded live in our collection, ranging from the sun-drenched cliffs of the Amalfi Coast to overwater private villas in French Polynesia.

Would you prefer a relaxing island sanctuary, a historic cultural voyage, or an exhilarating mountain expedition?`,
    suggestedDestinations: destinations.slice(0, 3),
    quickPrompts: [
      '🏝️ Private island getaways',
      '🗺️ View all destinations',
      '💰 Trips under $3,500',
      '👑 Tell me about Platinum Elite perks',
    ],
    detectedIntent: 'general_exploration',
  }
}
function getFollowUpPrompts(destinations, language) {
  if (language === 'si') {
    return ['මිල ගණන් මොනවාද?', 'වෙන්කරවා ගන්නේ කෙසේද?', 'වෙනත් ගමනාන්ත']
  }
  if (language === 'ta') {
    return ['கட்டண விவரங்கள்', 'முன்பதிவு செய்வது எப்படி?', 'பிற இடங்கள்']
  }
  if (destinations && destinations.length > 0) {
    return [
      `Tell me more about ${destinations[0].title}`,
      'Show packages under $3,500',
      'How does booking work?',
    ]
  }
  return [
    '🏝️ Best romantic getaways',
    '💰 Trips under $3,500',
    '👑 Platinum Elite benefits',
  ]
}
