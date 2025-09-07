'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '../contexts/AppContext'

const HomePage = () => {
  const router = useRouter()
  const { resetApp, setCurrentPage } = useApp()

  // Disable body scroll immediately and prevent any scrolling
  useEffect(() => {
    // Clear conversation data from localStorage first
    localStorage.removeItem('divyadarshak-conversation')
    console.log('🗑️ Cleared conversation data from localStorage')
    
    // Reset entire app state when HomePage loads (on refresh or navigation)
    resetApp()
    setCurrentPage('home')
    console.log('🔄 App reset complete on HomePage load')
    
    // Store original styles
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalHeight = document.body.style.height
    const originalWidth = document.body.style.width
    
    // Apply scroll prevention immediately
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.height = '100vh'
    document.body.style.width = '100vw'
    document.body.style.top = '0'
    document.body.style.left = '0'
    
    // Also prevent scrolling on html element
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100vh'
    
    return () => {
      // Restore original styles
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.height = originalHeight
      document.body.style.width = originalWidth
      document.body.style.top = ''
      document.body.style.left = ''
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
    }
  }, [])


  return (
    <div className="fixed inset-0 md:flex md:justify-center md:items-center" style={{backgroundColor: '#FFFAF4'}}>
      <div className="relative w-full h-full md:w-[480px] lg:w-[520px] md:h-screen md:shadow-xl md:border md:border-gray-200" style={{backgroundColor: '#FFFAF4'}}>
        
        {/* Full Height Background */}
        <div 
          className="absolute inset-0 w-full h-full" 
          style={{backgroundColor: '#FFFAF8', zIndex: 1}}
        ></div>

        {/* Content Layer */}
        <div className="relative w-full h-full" style={{zIndex: 2}}>

          {/* Title Frame */}
          <div className="absolute flex flex-col justify-center items-center" style={{width: '77.6%', height: '5.9%', left: 'calc(50% - 77.6%/2 + 0.8%)', top: '10%', padding: '1.2%'}}>
            <h1 className="font-bold text-center text-[#F46200] md:text-3xl lg:text-4xl" style={{fontFamily: 'Inter, sans-serif', fontSize: 'clamp(20px, 6.1vw, 36px)', lineHeight: '125%', letterSpacing: '-0.011em'}}>Divya Darshak</h1>
          </div>

          {/* Central Image */}
          <div className="absolute" style={{width: '36.6%', height: '16.9%', left: 'calc(50% - 36.6%/2)', top: '20%', borderRadius: '50%'}}>
            <img 
              src="/image copy.png"
              alt="Divya Darshak"
              className="w-full h-full object-contain"
              style={{borderRadius: '50%'}}
            />
          </div>

          {/* Subtitle Frame */}
          <div className="absolute flex flex-col justify-center items-center" style={{width: '77.6%', height: '8.9%', left: 'calc(50% - 77.6%/2)', top: '39%', padding: '1.2%'}}>
            <p className="italic font-medium text-center text-[#393939] md:text-2xl lg:text-3xl" style={{fontFamily: 'Inter, sans-serif', fontSize: 'clamp(18px, 5.6vw, 30px)', lineHeight: '125%', letterSpacing: '-0.011em'}}>
              Mahakumbh mein apka margdarshak!
            </p>
          </div>

          {/* Yatra Shuru Karein Button */}
          <div className="absolute flex justify-center items-center" style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: '80%'
          }}>
            <button 
              onClick={() => router.push('/sarathi')}
              className="flex flex-row justify-center items-center w-[250px] h-[38px] md:w-[300px] md:h-[45px] lg:w-[350px] lg:h-[50px]"
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '9px 49px',
                gap: '8px',
                background: 'linear-gradient(249.28deg, #F46200 15.52%, #E9842F 53.01%)',
                borderRadius: '12px',
                border: 'none'
              }}
            >
              <span 
                className="text-sm md:text-base lg:text-lg"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  lineHeight: '140%',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#FFFAF4',
                  flex: 'none',
                  order: '0',
                  flexGrow: '0'
                }}
              >
                Yatra Shuru Karein
              </span>
            </button>
          </div>


        </div>
      </div>
    </div>
  )
}
export default HomePage
