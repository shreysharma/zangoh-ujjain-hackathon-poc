// Translation utility functions

// Enhanced language detection with more script support
export const detectLanguage = (text: string): string => {
  // Remove whitespace and special characters for analysis
  const cleanText = text.replace(/[^\p{L}]/gu, '')
  
  if (!cleanText) return 'en'
  
  // Check for different script patterns
  const devanagariPattern = /[\u0900-\u097F]/
  const teluguPattern = /[\u0C00-\u0C7F]/     // Telugu script
  const tamilPattern = /[\u0B80-\u0BFF]/      // Tamil script
  const kannadaPattern = /[\u0C80-\u0CFF]/    // Kannada script
  const malayalamPattern = /[\u0D00-\u0D7F]/  // Malayalam script
  const bengaliPattern = /[\u0980-\u09FF]/    // Bengali script
  const gujaratiPattern = /[\u0A80-\u0AFF]/   // Gujarati script
  const punjabiPattern = /[\u0A00-\u0A7F]/    // Punjabi script
  const thaiPattern = /[\u0E00-\u0E7F]/
  const chinesePattern = /[\u4E00-\u9FFF]/
  const arabicPattern = /[\u0600-\u06FF]/
  const cyrillicPattern = /[\u0400-\u04FF]/
  
  if (teluguPattern.test(text)) return 'te' // Telugu
  if (tamilPattern.test(text)) return 'ta' // Tamil
  if (kannadaPattern.test(text)) return 'kn' // Kannada
  if (malayalamPattern.test(text)) return 'ml' // Malayalam
  if (bengaliPattern.test(text)) return 'bn' // Bengali
  if (gujaratiPattern.test(text)) return 'gu' // Gujarati
  if (punjabiPattern.test(text)) return 'pa' // Punjabi
  if (devanagariPattern.test(text)) return 'hi' // Hindi
  if (thaiPattern.test(text)) return 'th' // Thai
  if (chinesePattern.test(text)) return 'zh' // Chinese
  if (arabicPattern.test(text)) return 'ar' // Arabic
  if (cyrillicPattern.test(text)) return 'ru' // Russian
  
  return 'en' // Default to English
}

// Enhanced translation mapping for common phrases
const translationMap: Record<string, Record<string, string>> = {
  hi: {
    'हेलो': 'Hello',
    'नमस्ते': 'Hello/Greetings',
    'धन्यवाद': 'Thank you',
    'हाँ': 'Yes',
    'नहीं': 'No',
    'कैसे हैं आप?': 'How are you?',
    'मैं ठीक हूँ': 'I am fine'
  },
  te: {
    'హలో': 'Hello',
    'నమస్కారం': 'Hello/Greetings', 
    'ధన్యవాదాలు': 'Thank you',
    'అవును': 'Yes',
    'కాదు': 'No',
    'మీరు ఎలా ఉన్నారు?': 'How are you?',
    'నేను బాగానే ఉన్నాను': 'I am fine'
  },
  ta: {
    'ஹலோ': 'Hello',
    'வணக்கம்': 'Hello/Greetings',
    'நன்றி': 'Thank you',
    'ஆம்': 'Yes',
    'இல்லை': 'No'
  },
  th: {
    'อื': 'Uh/Um',
    'สวัสดี': 'Hello',
    'ขอบคุณ': 'Thank you',
    'ใช่': 'Yes',
    'ไม่': 'No'
  }
}

// Get translation for text
export const getTranslation = async (text: string, fromLang: string): Promise<string> => {
  // First try local translation map for common phrases
  const localTranslation = translationMap[fromLang]?.[text.trim()]
  if (localTranslation) {
    return localTranslation
  }
  
  // Try free MyMemory API for more complex translations
  try {
    const encodedText = encodeURIComponent(text.trim())
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${fromLang}|en`
    
    const response = await fetch(apiUrl)
    
    if (response.ok) {
      const data = await response.json()
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText
        return translated
      }
    }
  } catch (error) {
    console.warn('🌐 Translation API failed:', error)
  }
  
  // Fallback: return original text with language tag
  return text // Return original text instead of brackets
}

// Clean and normalize text
export const cleanText = (text: string): string => {
  if (!text) return text
  
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Fix common formatting issues
    .replace(/\.\s*\./g, '.')
    .replace(/\?\s*\?/g, '?')
    .replace(/!\s*!/g, '!')
    // Remove "null" artifacts
    .replace(/^null\s*/gi, '')
    .replace(/\s*null$/gi, '')
    // Trim
    .trim()
}

// Check if text contains mixed languages
export const hasMixedLanguages = (text: string): boolean => {
  const words = text.split(/\s+/)
  const languages = new Set()
  
  for (const word of words) {
    if (word.length > 2) { // Skip short words
      const lang = detectLanguage(word)
      languages.add(lang)
      if (languages.size > 1) return true
    }
  }
  
  return false
}

// Main translation function with text cleaning
export const translateToEnglish = async (text: string): Promise<{ 
  original: string, 
  translated: string, 
  language: string,
  needsTranslation: boolean,
  cleaned: string
}> => {
  // Clean the input text first
  const cleaned = cleanText(text)
  if (!cleaned) {
    return {
      original: text,
      translated: text,
      language: 'en',
      needsTranslation: false,
      cleaned: text
    }
  }
  
  const detectedLang = detectLanguage(cleaned)
  const needsTranslation = detectedLang !== 'en'
  
  if (!needsTranslation) {
    return {
      original: text,
      translated: cleaned,
      language: 'en',
      needsTranslation: false,
      cleaned
    }
  }
  
  // Check for mixed languages - if so, try to translate the whole text
  if (hasMixedLanguages(cleaned)) {
    // For mixed language text, try to translate using the most prominent language
    const translated = await getTranslation(cleaned, detectedLang)
    return {
      original: text,
      translated: cleanText(translated),
      language: detectedLang,
      needsTranslation: true,
      cleaned
    }
  }
  
  const translated = await getTranslation(cleaned, detectedLang)
  
  return {
    original: text,
    translated: cleanText(translated),
    language: detectedLang,
    needsTranslation: true,
    cleaned
  }
}