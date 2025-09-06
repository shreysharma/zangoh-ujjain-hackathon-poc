'use client'

import GyanKoshPage from '../../components/GyanKoshPage'
import { useRouter } from 'next/navigation'

export default function GyanKosh() {
  const router = useRouter()
  
  return <GyanKoshPage onBack={() => router.push('/')} />
}