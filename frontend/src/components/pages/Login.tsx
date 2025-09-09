'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authUtils } from '../../utils/auth'
import { SessionManager } from '../../utils/sessionManager'
import ApiStatusIndicator from '../ApiStatusIndicator'
import Notification from '../Notification'
import { useApiHealth } from '../../hooks/useApiHealth'
import OfflineMode from '../OfflineMode'
import { getLoginErrorMessage } from '../../utils/errorMessages'

const Login = () => {
 const router = useRouter()
 const [formData, setFormData] = useState({
   username: '',
   password: ''
 })
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState('')
 const [showPassword, setShowPassword] = useState(false)
 const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null)
 
 const { isHealthy, isChecking, retryConnection } = useApiHealth()

 const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
   setNotification({ message, type })
 }

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const { name, value } = e.target
   setFormData(prev => ({
     ...prev,
     [name]: value
   }))
 }

 const togglePasswordVisibility = () => {
   setShowPassword(!showPassword)
 }

 // Check if user is already logged in and initialize auto-cleanup
 useEffect(() => {
   if (authUtils.isAuthenticated()) {
     router.push('/audio')
   }
  
   // Initialize automatic session cleanup when app loads
   SessionManager.initializeAutoCleanup()
  
   // Cleanup on unmount
   return () => {
     SessionManager.stopAutoCleanup()
   }
 }, [router])

 const handleLogin = async (e: React.FormEvent) => {
   e.preventDefault()
   setIsLoading(true)
   setError('')

   // Check API health before attempting login
   if (!isHealthy) {
     const errorMsg = 'Service temporarily unavailable. Please try again in a moment.'
     setError(errorMsg)
     setIsLoading(false)
     showNotification(errorMsg, 'error')
     return
   }
  
   try {
     // Call the external login API
     const result = await authUtils.login(formData.username, formData.password)
    
     if (result.success) {
       showNotification('Login successful!', 'success')
       setIsLoading(false)
       router.push('/audio')
     } else {
       setIsLoading(false)
       // Use friendly error message instead of raw backend response
       const errorMsg = getLoginErrorMessage(result)
       setError(errorMsg)
       showNotification(errorMsg, 'error')
     }
   } catch (error) {
     setIsLoading(false)
     // Use friendly error message instead of raw error
     const errorMsg = getLoginErrorMessage(error)
     setError(errorMsg)
     showNotification(errorMsg, 'error')
     console.error('Login error:', error)
   }
 }

 // Only show offline mode if we've explicitly determined API is unreachable
 // Comment out for now to allow normal login flow
 // if (!isHealthy && !isChecking) {
 //   return <OfflineMode onRetry={retryConnection} isRetrying={isChecking} />
 // }

 return (
   <main className='w-screen h-screen flex justify-center items-center '>
     <ApiStatusIndicator showNotification={showNotification} />
     <div className="w-[500px] h-full flex flex-col justify-center px-8 bg-white relative">
      
       <div className='flex-none px-8'>

         {/* Welcome Message */}
         <div className='mb-20 text-center'>
           <h1 className="font-general-sans font-[600] text-[22px] leading-[100%] tracking-[0] text-[#282828]">
             Welcome to Servotech AI
           </h1>
           <p className='font-general-sans font-[400] text-[16px] leading-[100%] tracking-[0] text-[#666666] mt-2'>
             Log in to continue to your account
           </p>
         </div>

         {/* Login Form */}
         <form onSubmit={handleLogin} className='space-y-6 mb-8'>
           <div className='relative mb-8'>
            <label
              htmlFor="username"
              className="absolute -top-2 left-4 px-1 bg-white text-[#282828]
                        font-general-sans font-[500] text-[12px] leading-[100%]"
              style={{ letterSpacing: "0%" }}
            >
              Email Id
            </label>

            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg border border-[#B3B3B3]
                        text-[14px] text-black font-general-sans placeholder-[#808080]
                        focus:outline-none focus:border-[#282828] transition-all"
            />
           </div>
          
           <div className='relative mb-20'>
            <label
              htmlFor="password"
              className="absolute -top-[10px] left-4 px-1 bg-white text-[#282828]
                        font-general-sans font-[500] text-[12px] leading-[100%] z-10"
              style={{
                letterSpacing: "0%",
                lineHeight: "100%",
              }}
            >
              Password
            </label>

            <div className='relative'>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-[#B3B3B3]
                          text-[14px] text-black font-general-sans placeholder-[#808080]
                          focus:outline-none focus:border-[#282828] transition-all"
              />

              {/* Toggle visibility button */}
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M2.45703 12C3.73128 7.94291 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>


           {/* Login Button */}
           <button
             type="submit"
             disabled={isLoading}
             className='w-full rounded-xl flex items-center justify-center px-5 py-4 cursor-pointer bg-gradient-to-r from-[#324673] to-[#305D8E] hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-8'
           >
             {isLoading ? (
               <div className='flex items-center gap-2'>
                 <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                 <span className='text-white text-[16px] font-[500] font-general-sans'>
                   Logging in...
                 </span>
               </div>
             ) : (
               <span className='text-white text-[16px] font-[500] font-general-sans'>
                 Log In
               </span>
             )}
           </button>
         </form>

         {/* Additional Options */}
       </div>

       {/* Home Bar */}
       <div className='absolute bottom-4 left-1/2 -translate-x-1/2 w-full h-[34px] flex justify-center items-center'>
         <div className='w-[170px] h-[6px] bg-black rounded-full'></div>
       </div>

     </div>
     
     {notification && (
       <Notification
         message={notification.message}
         type={notification.type}
         onClose={() => setNotification(null)}
       />
     )}
   </main>
 )
}

export default Login


