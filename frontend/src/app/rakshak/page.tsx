'use client'

import RakshakPage from '../../components/RakshakPage'
import { useRouter } from 'next/navigation'

export default function Rakshak() {
  const router = useRouter()
  
  return <RakshakPage onBack={() => router.push('/')} />
}