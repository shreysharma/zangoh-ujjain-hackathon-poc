import { useState, useEffect } from 'react'

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
    url: string
  }
  productLinks?: ProductLink[]
  isAudio?: boolean
  isStreaming?: boolean
  originalText?: string  // Store original non-English text
  language?: string      // Detected language code
  // Legacy support for old interface
  text?: string
  isUser?: boolean
  audioChunks?: string[]
}

const CONVERSATION_STORAGE_KEY = 'divyadarshak-conversation'

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
        console.log(`Loaded ${messagesWithDates.length} messages from local storage, filtered to ${filteredMessages.length} messages (removed product_links)`)
        
        // Update localStorage to remove product_links messages
        if (filteredMessages.length !== messagesWithDates.length) {
          localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(filteredMessages))
          console.log('Updated localStorage to remove product_links messages')
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
      console.log(`Saved ${messages.length} messages to local storage`)
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
      language: translationData?.language,
      // Legacy support
      text: content,
      isUser: type === 'human'
    }
    
    setMessages(prev => [...prev, newMessage])
    return newMessage.id
  }

  const addBotMessage = (content: string, isAudio?: boolean) => {
    return addMessage(content, 'bot', undefined, undefined, isAudio, false)
  }

  const addHumanMessage = (content: string, file?: { name: string; type: string; url: string }) => {
    console.log('🔍 useConversation - addHumanMessage called:', { content, hasFile: !!file })
    const messageId = addMessage(content, 'human', file)
    console.log('🔍 useConversation - Message added with ID:', messageId)
    console.log('🔍 useConversation - Current messages:', messages)
    return messageId
  }

  const addStatusMessage = (content: string) => {
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

    const cleanedContent = content.replace(/^null/gi, '').trim()
    if (!cleanedContent) {
      return ''
    }

    let messageId = ''
    
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1]
      
      // Check if last message is a streaming bot message of the same type
      if (lastMessage && 
          lastMessage.type === 'bot' && 
          lastMessage.isStreaming !== false &&
          lastMessage.isAudio === isAudio) {
        
        // Update existing message - ACCUMULATE content properly
        let accumulatedContent = lastMessage.content
        
        // Check if new content is cumulative (includes all previous) or incremental
        if (cleanedContent.startsWith(lastMessage.content)) {
          // Backend sent cumulative text (includes all previous)
          accumulatedContent = cleanedContent
        } else if (!lastMessage.content.includes(cleanedContent)) {
          // New incremental text to append - add space if needed
          const needsSpace = lastMessage.content && !lastMessage.content.endsWith(' ') && !cleanedContent.startsWith(' ')
          accumulatedContent = lastMessage.content + (needsSpace ? ' ' : '') + cleanedContent
        } else {
          // Duplicate or already included, keep existing
          accumulatedContent = lastMessage.content
        }
        
        const updatedMessage = {
          ...lastMessage,
          content: accumulatedContent,
          text: accumulatedContent, // Legacy support
          isStreaming: true
        }
        
        const updatedMessages = [...prev]
        updatedMessages[updatedMessages.length - 1] = updatedMessage
        messageId = updatedMessage.id
        return updatedMessages
      } else {
        // Add new message
        const newMessage: Message = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: 'bot',
          content: cleanedContent,
          text: cleanedContent, // Legacy support
          timestamp: new Date(),
          isAudio,
          isStreaming: true,
          isUser: false // Legacy support
        }
        
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
        const lastMessage = prev[prev.length - 1]
        
        if (lastMessage && 
            lastMessage.type === 'bot' && 
            lastMessage.isStreaming &&
            lastMessage.isAudio === isAudio) {
          
          const finalContent = content.replace(/^null/gi, '').trim()
          const finalizedMessage = {
            ...lastMessage,
            content: finalContent,
            text: finalContent, // Legacy support
            isStreaming: false
          }
          
          const updatedMessages = [...prev]
          updatedMessages[updatedMessages.length - 1] = finalizedMessage
          return updatedMessages
        }
        return prev
      })
    }
  }

  const clearConversation = () => {
    setMessages([])
    localStorage.removeItem(CONVERSATION_STORAGE_KEY)
    console.log('Conversation cleared from memory and local storage')
  }

  const clearProductMessages = () => {
    setMessages(prev => {
      const filteredMessages = prev.filter(msg => msg.type !== 'product_links')
      console.log(`Cleared ${prev.length - filteredMessages.length} product messages from conversation`)
      return filteredMessages
    })
  }

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
    clearProductMessages
  }
}