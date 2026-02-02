'use client'

import { Suspense } from 'react'
import AudioViewPage from '@/components/pages/AudioViewPage'
import { ConversationProvider } from '@/providers/ConversationProvider'

export default function AudioPage() {
  return (
    <ConversationProvider>
      <Suspense fallback={<div>Loading audio view...</div>}>
        <AudioViewPage />
      </Suspense>
    </ConversationProvider>
  )
}