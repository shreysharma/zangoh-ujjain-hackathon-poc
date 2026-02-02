'use client'

import { Suspense } from 'react'
import ChatViewPage from '@/components/pages/ChatViewPage'
import { ConversationProvider } from '@/providers/ConversationProvider'

export default function ChatPage() {
  return (
    <ConversationProvider>
      <Suspense fallback={<div>Loading chat...</div>}>
        <ChatViewPage />
      </Suspense>
    </ConversationProvider>
  )
}