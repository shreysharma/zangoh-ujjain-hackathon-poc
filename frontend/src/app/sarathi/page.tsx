'use client'

import SarathiPage from '../../components/SarathiPage'
import { useRouter } from 'next/navigation'

export default function Sarathi() {
  const router = useRouter()
  
  return <SarathiPage onBack={() => router.push('/')} />
}