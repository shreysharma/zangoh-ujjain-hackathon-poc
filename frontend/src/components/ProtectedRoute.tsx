'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authUtils } from '../utils/auth'
import { Truculenta } from 'next/font/google'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authenticated = authUtils.isAuthenticated()
      setIsAuthenticated(authenticated)
      setIsChecking(false)

      if (!authenticated) {
        // Check if session might have expired
        const loginData = localStorage.getItem('indiamart_login_token')
        if (loginData) {
          setSessionExpired(true)
          // Small delay to show session expired message
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          // No session data, redirect immediately
          router.push('/')
        }
      }
    }

    // Small delay to avoid hydration issues
    const timer = setTimeout(checkAuth, 100)
    
    return () => clearTimeout(timer)
  }, [router])

  // Show session expired message
  if (sessionExpired) {
    return (
      <div className='w-screen h-screen flex justify-center items-center'>
        <div className='w-[500px] h-full relative bg-white flex flex-col justify-center items-center'>
          <div className='text-center'>
            <div className='w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center'>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ef4444"/>
              </svg>
            </div>
            <h2 className='text-[#ef4444] text-[20px] font-[600] font-general-sans mb-2'>
              Session Expired
            </h2>
            <p className='text-[#666666] text-[16px] font-general-sans mb-4'>
              Your session has expired after 1 hour.<br />
              Redirecting to login page...
            </p>
            <div className='flex items-center justify-center gap-2'>
              <div className='w-4 h-4 border-2 border-[#269697] border-t-transparent rounded-full animate-spin'></div>
              <span className='text-[#269697] text-[14px] font-general-sans'>
                Redirecting...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className='w-screen h-screen flex justify-center items-center'>
        <div className='w-[500px] h-full relative bg-white flex flex-col justify-center items-center'>
          <div className='flex items-center gap-3'>
            <div className='w-6 h-6 border-2 border-[#269697] border-t-transparent rounded-full animate-spin'></div>
            <span className='text-[#269697] text-[16px] font-[500] font-general-sans'>
              Checking authentication...
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null
}

export default ProtectedRoute