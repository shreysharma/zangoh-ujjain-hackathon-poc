import { useState, useEffect, useCallback } from 'react'
import { cleanText } from '../utils/translationUtils'
import { SessionManager } from '../utils/sessionManager'

// Function to remove HTML/XML tags from text
const stripTags = (text: string): string => {
  if (!text) return text
  // Remove all HTML/XML tags like <noise>, <tag>, etc.
  return text.replace(/<[^>]*>/g, '').trim()
}

export interface ProductLink {
  url: string
  title: string
  company?: string
  companyName?: string  // Backend sends this field
  city?: string
  rating?: string
  supplier_rating?: number  // Backend sends this field
  source?: string
  image_url?: string
  product_url?: string  // Backend sends this field for product images
  // Dynamic scraped data
  price?: string  // Scraped price from product page
  minOrder?: string  // Minimum order quantity
  availability?: string  // Product availability
  scrapedData?: {  // Full scraped data object
    price: string
    images: string[]
    company: string
    location: string
    description: string
    specifications: Record<string, string>
    rating: string
    minOrder: string
    availability: string
  }
  raw_link?: {
    url: string
    title: string
    source: string
    image_url?: string
    display_link?: string
  }
}

export interface Message {
  id: string
  type: 'bot' | 'human' | 'status' | 'tool' | 'product_links'
  content: string
  timestamp: Date
  file?: {
    name: string
    type: string
    url?: string  // Optional - for preview only, not stored in localStorage
    previewUrl?: string  // Temporary preview URL (in-memory only)
  }
  productLinks?: ProductLink[]
  isAudio?: boolean
  isStreaming?: boolean
  originalText?: string  // Store original non-English text
  language?: string      // Detected language code
}

const CONVERSATION_STORAGE_KEY = 'indiamart-conversation'

export const useConversation = () => {
  const [messages, setMessages] = useState<Message[]>([])

  // Load messages from local storage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(CONVERSATION_STORAGE_KEY)
    if (savedMessages) {
      try {
        const parsedMessages: Message[] = JSON.parse(savedMessages)
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        
        // Filter out product_links messages on page refresh
        const filteredMessages = messagesWithDates.filter(msg => msg.type !== 'product_links')
        
        setMessages(filteredMessages)
        
        // Update localStorage to remove product_links messages
        if (filteredMessages.length !== messagesWithDates.length) {
          localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(filteredMessages))
        }
      } catch (error) {
        console.error('Failed to parse saved messages:', error)
        localStorage.removeItem(CONVERSATION_STORAGE_KEY)
      }
    }
  }, [])

  // Save messages to local storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  const addMessage = (
    content: string, 
    type: 'bot' | 'human' | 'status' | 'tool' | 'product_links', 
    file?: { name: string; type: string; url: string },
    productLinks?: ProductLink[],
    isAudio?: boolean,
    isStreaming?: boolean,
    translationData?: { originalText: string; language: string }
  ) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      content,
      timestamp: new Date(),
      file,
      productLinks,
      isAudio,
      isStreaming,
      originalText: translationData?.originalText,
      language: translationData?.language
    }
    
    // Add to current session
    SessionManager.addMessageToCurrentSession(newMessage)
    
    setMessages(prev => [...prev, newMessage])
    return newMessage.id
  }

  const addBotMessage = (content: string, isAudio?: boolean) => {
    return addMessage(content, 'bot', undefined, undefined, isAudio, false)
  }

  const addHumanMessage = async (content: string, file?: { name: string; type: string; url: string }) => {
    // Strip HTML/XML tags from user message before storing
    const cleanedContent = stripTags(content)
    return addMessage(cleanedContent, 'human', file)
  }

  const addStatusMessage = (content: string) => {
    // Remove all previous status messages before adding the new one
    setMessages(prev => prev.filter(msg => msg.type !== 'status'))
    return addMessage(content, 'status')
  }

  const addToolMessage = (content: string) => {
    return addMessage(content, 'tool')
  }

  const addProductLinks = (links: ProductLink[], functionName?: string) => {
    
    const content = functionName ? `Search results from ${functionName}` : 'Product search results'
    return addMessage(content, 'product_links', undefined, links)
  }

  // Update or add streaming bot message
  const updateOrAddBotMessage = (content: string, isAudio = false): string => {
    if (!content || content.trim() === '' || content === 'null') {
      return ''
    }

    // Use enhanced text cleaning
    const cleanedContent = cleanText(content)
    if (!cleanedContent) {
      return ''
    }

    let messageId = ''
    
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1]
      const now = new Date()
      
      // Check if last message is a streaming bot message of the same type AND within reasonable time
      if (lastMessage && 
          lastMessage.type === 'bot' && 
          lastMessage.isStreaming !== false &&
          lastMessage.isAudio === isAudio &&
          (now.getTime() - lastMessage.timestamp.getTime()) < 30000) {
        
        // Check if content is actually different to avoid unnecessary updates
        if (lastMessage.content === cleanedContent) {
          messageId = lastMessage.id
          return prev // No change needed
        }
        
        // Update existing message
        const updatedMessage = {
          ...lastMessage,
          content: cleanedContent,
          isStreaming: true,
          timestamp: lastMessage.timestamp // Keep original timestamp
        }
        
        // Update in session manager too
        SessionManager.updateMessageInCurrentSession(updatedMessage)
        
        const updatedMessages = [...prev]
        updatedMessages[updatedMessages.length - 1] = updatedMessage
        messageId = updatedMessage.id
        return updatedMessages
      } else {
        // Check if we have a very recent duplicate (within 100ms) with same content
        const veryRecentDuplicate = prev.find(msg => 
          msg.type === 'bot' && 
          msg.isAudio === isAudio &&
          msg.content === cleanedContent &&
          (now.getTime() - msg.timestamp.getTime()) < 100
        )
        
        if (veryRecentDuplicate) {
          messageId = veryRecentDuplicate.id
          return prev // Don't add duplicate
        }
        
        // Add new message
        const newMessage: Message = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: 'bot',
          content: cleanedContent,
          timestamp: now,
          isAudio,
          isStreaming: true
        }
        
        // Add to session manager
        SessionManager.addMessageToCurrentSession(newMessage)
        
        messageId = newMessage.id
        return [...prev, newMessage]
      }
    })

    return messageId
  }

  // Finalize streaming message
  const finalizeStreamingMessage = (content?: string, isAudio = false) => {
    if (content && content.trim() && content !== 'null') {
      setMessages(prev => {
        // Find the most recent streaming bot message of the same type
        for (let i = prev.length - 1; i >= 0; i--) {
          const message = prev[i]
          if (message.type === 'bot' && 
              message.isStreaming &&
              message.isAudio === isAudio) {
            
            const finalizedMessage = {
              ...message,
              content: cleanText(content),
              isStreaming: false
            }
            
            // Update in session manager too
            SessionManager.updateMessageInCurrentSession(finalizedMessage)
            
            const updatedMessages = [...prev]
            updatedMessages[i] = finalizedMessage
            return updatedMessages
          }
        }
        
        // If no streaming message found, create a new one
        const newMessage: Message = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: 'bot',
          content: cleanText(content),
          timestamp: new Date(),
          isAudio,
          isStreaming: false
        }
        
        SessionManager.addMessageToCurrentSession(newMessage)
        return [...prev, newMessage]
      })
    }
  }

  const clearConversation = useCallback(() => {
    setMessages([])
    localStorage.removeItem(CONVERSATION_STORAGE_KEY)
  }, [])

  const forceResetConversation = useCallback(() => {
    setMessages([])
    localStorage.removeItem(CONVERSATION_STORAGE_KEY)
    localStorage.removeItem('indiamart-session-current')
    localStorage.removeItem('indiamart-sessions')
  }, [])

  const clearProductMessages = useCallback(() => {
    setMessages(prev => {
      const filteredMessages = prev.filter(msg => msg.type !== 'product_links')
      return filteredMessages
    })
  }, [])

  return {
    messages,
    addBotMessage,
    addHumanMessage,
    addStatusMessage,
    addToolMessage,
    addProductLinks,
    updateOrAddBotMessage,
    finalizeStreamingMessage,
    clearConversation,
    clearProductMessages,
    forceResetConversation
  }
}