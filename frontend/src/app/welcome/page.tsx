'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import WelcomePage from "@/components/WelcomePage"
import { ConversationProvider } from "@/providers/ConversationProvider"
import { SessionManager } from "@/utils/sessionManager"

export default function Welcome() {
  const router = useRouter()

  // Initialize auto-cleanup when welcome page loads
  useEffect(() => {
    SessionManager.initializeAutoCleanup()
    
    return () => {
      SessionManager.stopAutoCleanup()
    }
  }, [])

  const handleStartConversation = () => {
    // Navigate to audio view to start conversation
    router.push('/audio')
  }

  return (
    <ConversationProvider>
      <WelcomePage onStartConversation={handleStartConversation} />
    </ConversationProvider>
  )
}