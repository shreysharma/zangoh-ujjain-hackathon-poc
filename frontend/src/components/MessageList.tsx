import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Message, ProductLink } from '../hooks/useConversation'

// Image cache to prevent repeated API calls
const imageCache = new Map<string, string>()

// Product data cache to prevent repeated API calls
const productDataCache = new Map<string, ScrapedProductData | null>()

// LocalStorage keys
const PRODUCT_CACHE_KEY = 'indiamart_product_cache'
const IMAGE_CACHE_KEY = 'indiamart_image_cache'

// Load cached data from localStorage on startup
const loadProductCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem(PRODUCT_CACHE_KEY)
    if (stored) {
      const parsedData = JSON.parse(stored)
      Object.entries(parsedData).forEach(([key, value]) => {
        productDataCache.set(key, value as ScrapedProductData | null)
      })
    }
  } catch (error) {
    console.error('Failed to load product cache from localStorage:', error)
  }
}

// Save product cache to localStorage
const saveProductCacheToStorage = () => {
  try {
    const cacheObject = Object.fromEntries(productDataCache)
    localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(cacheObject))
  } catch (error) {
    console.error('Failed to save product cache to localStorage:', error)
  }
}

// Load image cache from localStorage
const loadImageCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem(IMAGE_CACHE_KEY)
    if (stored) {
      const parsedData = JSON.parse(stored)
      Object.entries(parsedData).forEach(([key, value]) => {
        imageCache.set(key, value as string)
      })
    }
  } catch (error) {
    console.error('Failed to load image cache from localStorage:', error)
  }
}

// Save image cache to localStorage
const saveImageCacheToStorage = () => {
  try {
    const cacheObject = Object.fromEntries(imageCache)
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cacheObject))
  } catch (error) {
    console.error('Failed to save image cache to localStorage:', error)
  }
}

// Initialize caches from localStorage
if (typeof window !== 'undefined') {
  loadProductCacheFromStorage()
  loadImageCacheFromStorage()
}

// Star rating component
const StarRating = ({ rating, ratingCount }: { rating: number; ratingCount?: number }) => {
  const fullStars = Math.floor(rating)
  const decimal = rating % 1
  const hasHalfStar = decimal > 0 && decimal < 1
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className='flex items-center gap-1'>
      <div className='flex'>
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className='text-yellow-400'>★</span>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <span key="half" className='relative inline-block'>
            <span className='text-gray-300'>★</span>
            <span
              className='absolute top-0 left-0 text-yellow-400 overflow-hidden'
              style={{ width: `${decimal * 100}%` }}
            >
              ★
            </span>
          </span>
        )}

        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className='text-gray-300'>★</span>
        ))}
      </div>
      <span className='text-xs text-gray-600'>
        {rating.toFixed(1)}
        {ratingCount && ` (${ratingCount})`}
      </span>
    </div>
  )
}

interface MessageListProps {
  messages: Message[]
  isVisible?: boolean
}

// Component to handle dynamic product data fetching
interface ProductCardProps {
  link: ProductLink
}

interface ScrapedProductData {
  price: string
  images: string[]
  company: string
  location: string
  description: string
  specifications: Record<string, string>
  rating: string
  minOrder: string
  availability: string
  productName?: string
}

const ProductCard = ({ link }: ProductCardProps) => {
  const [productData, setProductData] = useState<ScrapedProductData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Create a stable key for this product's data
  const productKey = useMemo(() => {
    return link.raw_link?.url || link.url || ""
  }, [link.raw_link?.url, link.url])

  useEffect(() => {
    const fetchProductData = async () => {
      if (!productKey || !productKey.includes('indiamart.com')) {
        console.log('ProductCard - Skipping product fetch, productKey:', productKey)
        return
      }

      // Check cache first
      if (productDataCache.has(productKey)) {
        setProductData(productDataCache.get(productKey)!)
        return
      }

      setIsLoading(true)
      console.log('ProductCard - Fetching product data for:', productKey)
      try {
        const response = await fetch(`/api/extract-product?url=${encodeURIComponent(productKey)}`)
        const result = await response.json()

        console.log('ProductCard - API response:', result)

        const resultData = result.success && result.data ? result.data : null

        // Cache the result
        productDataCache.set(productKey, resultData)
        setProductData(resultData)

        // Save to localStorage
        saveProductCacheToStorage()
      } catch (error) {
        console.error('Failed to fetch product data:', error)
        // Cache the error result as null
        productDataCache.set(productKey, null)
        setProductData(null)

        // Save to localStorage
        saveProductCacheToStorage()
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductData()
  }, [productKey])

  const getPrice = () => {
    if (productData?.price) return productData.price
    if (link.price) return link.price
    return isLoading ? 'Loading...' : '₹ Price on request'
  }

  const getCompany = () => {
    if (productData?.company) return productData.company
    return link.company || link.companyName || 'IndiaMART'
  }

  const getSupplierDisplay = () => {
    const rating = link.rating || link.supplier_rating
    const ratingCount = link.rating_count
    const hasRating = rating && rating !== 'N/A' && !isNaN(Number(rating))

    return (
      <div className='space-y-1'>
        {/* Price */}
        <div className='text-[#002866] text-[16px] font-[500] font-general-sans'>
          {productData?.price || link.price || (isLoading ? 'Loading...' : '₹ Price on request')}
        </div>

        {/* Rating */}
        {hasRating && (
          <StarRating
            rating={Number(rating)}
            ratingCount={ratingCount ? Number(ratingCount) : undefined}
          />
        )}
      </div>
    )
  }

  return (
    <div className='min-w-[250px] bg-[#EEF6F5] rounded-[15px] border border-[#D9D9D9] p-3 flex flex-col'>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className='block flex-grow'
      >
        <div className='w-full h-[220px] bg-white rounded-[12px] border border-[#D9D9D9] overflow-hidden'>
          <ProductImage link={link} />
        </div>
        <div className='w-full mt-3 rounded-[12px]'>
          <div className='flex justify-between items-start m-3'>
            <h1 className='text-black text-[16px] font-[500] font-general-sans line-clamp-2 flex-1 pr-2'>
              {link.source === 'search_suppliers'
                ? (productData?.productName || link.title || 'Product')
                : link.title
              }
            </h1>
            {/* Member Since Badge - top right, show as-is */}
            {link.source === 'search_suppliers' && link.member_since && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap'>
                {link.member_since}
              </span>
            )}
          </div>

          {/* Seller Name for suppliers */}
          {link.source === 'search_suppliers' && (
            <h2 className='text-[#1976d2] text-[14px] font-[500] font-general-sans mx-3 mb-2 line-clamp-2'>
              Seller: {link.company || link.companyName || (link.title !== 'None - Mumbai' ? link.title : 'Supplier')}
            </h2>
          )}

          <h2 className='text-[#565656] text-[16px] font-[500] font-general-sans m-3 line-clamp-2 overflow-hidden flex items-center gap-2'>
            {link.source === 'search_suppliers'
              ? (
                <>
                  <span className='text-[#666]'>⚲ </span>
                  <span>{link.city || 'India'}</span>
                </>
              )
              : `Seller: ${getCompany()}`
            }
          </h2>

          {/* GST and TrustSeal badges - always reserve space */}
          <div className='mx-3 mb-2 flex flex-wrap gap-1 min-h-[24px]'>
            {link.source === 'search_suppliers' && (
              <>
                {link.gst_verified && (
                  <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    ✓ GST Verified
                  </span>
                )}
                {link.trustseal && link.trustseal !== 'N/A' && (
                  <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    🛡️ TrustSeal
                  </span>
                )}
              </>
            )}
          </div>

          <div className='m-3'>
            {link.source === 'search_suppliers' ? getSupplierDisplay() : (
              <div className='text-[#002866] text-[16px] font-[500] font-general-sans'>
                {getPrice()}
              </div>
            )}
          </div>
        </div>
      </a>

      {/* Contact Supplier Button - always reserve space */}
      <div className='mt-2 px-3 min-h-[40px] flex items-end'>
        {link.source === 'search_suppliers' && link.catalog_url ? (
          <a
            href={link.catalog_url}
            target="_blank"
            rel="noopener noreferrer"
            className='block w-full bg-[#269697] text-white text-center text-[14px] font-[500] font-general-sans py-2 px-4 rounded-[8px] hover:bg-[#1d7578] transition-colors'
            onClick={(e) => e.stopPropagation()}
          >
            📞 &nbsp; Contact Supplier
          </a>
        ) : (
          <div className='w-full'></div>
        )}
      </div>
    </div>
  )
}

// Component to handle image preview from URLs
interface ProductImageProps {
  link: ProductLink
}

const ProductImage = ({ link }: ProductImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>("./pr.png")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Create a stable key for this link's image
  const imageKey = useMemo(() => {
    return link.image_url || link.raw_link?.url || link.url || link.product_url || ""
  }, [link.image_url, link.raw_link?.url, link.url, link.product_url])

  useEffect(() => {
    if (!imageKey) {
      setImageSrc("./pr.png")
      return
    }

    const loadImage = async () => {
      // First priority: direct image URL
      if (link.image_url) {
        setImageSrc(link.image_url)
        return
      }

      // Second priority: extract from URL if it's an IndiaMART product page
      const urlToExtract = link.raw_link?.url || link.url
      if (urlToExtract && urlToExtract.includes('indiamart.com')) {
        // Check cache first
        if (imageCache.has(urlToExtract)) {
          setImageSrc(imageCache.get(urlToExtract)!)
          return
        }

        setIsLoading(true)
        try {
          const apiUrl = `/api/extract-image?url=${encodeURIComponent(urlToExtract)}`

          const response = await fetch(apiUrl)
          const data = await response.json()

          const resultImage = data.success && data.bestImage ? data.bestImage : "./pr.png"

          // Cache the result
          imageCache.set(urlToExtract, resultImage)
          setImageSrc(resultImage)

          // Save to localStorage
          saveImageCacheToStorage()
        } catch (error) {
          console.error('ProductImage - Failed to extract image:', error)
          const fallbackImage = "./pr.png"
          imageCache.set(urlToExtract, fallbackImage)
          setImageSrc(fallbackImage)

          // Save to localStorage
          saveImageCacheToStorage()
        } finally {
          setIsLoading(false)
        }
        return
      }

      // Third priority: product_url
      if (link.product_url) {
        setImageSrc(link.product_url)
        return
      }

      // Fallback to placeholder
      setImageSrc("./pr.png")
    }

    loadImage()
  }, [imageKey, link.image_url, link.raw_link?.url, link.url, link.product_url])

  if (isLoading) {
    return (
      <div className='w-full h-full rounded-[12px] bg-gray-100 flex items-center justify-center'>
        <div className='animate-pulse bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center'>
          <span className='text-gray-400 text-xs'>⏳</span>
        </div>
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={link.title || link.company || link.companyName || "Product"}
      className='w-full h-full rounded-[12px] object-cover'
      onError={(e) => {
        console.log('ProductImage - Image failed to load:', imageSrc)
        const target = e.target as HTMLImageElement
        if (target.src !== "./pr.png") {
          target.src = "./pr.png"
        }
      }}
      onLoad={() => {
        console.log('ProductImage - Image loaded successfully:', imageSrc)
      }}
    />
  )
}


const MessageList = ({ messages, isVisible = true }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Format timestamp to show time like "6:36 PM"
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Check if user is near the bottom of the chat
  const checkIfNearBottom = () => {
    if (!containerRef.current) return false
    
    const container = containerRef.current
    const threshold = 100 // pixels from bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    
    return distanceFromBottom <= threshold
  }

  // Handle scroll events to detect if user manually scrolled up
  const handleScroll = () => {
    const isNearBottom = checkIfNearBottom()
    setShouldAutoScroll(isNearBottom)
  }

  // Auto-scroll to latest message when new messages arrive (only when user is at bottom)
  useEffect(() => {
    if (messages.length > 0 && isVisible && shouldAutoScroll) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && (lastMessage.content || lastMessage.productLinks)) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages, isVisible, shouldAutoScroll])

  const renderProductLinks = (links: ProductLink[]) => {
    if (!links || links.length === 0) return null


    // Using unified card design for all links

    return (
      <div className="mt-3 overflow-x-auto">
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='flex-1 overflow-y-scroll space-y-4 pb-18 pt-18 p-4 [&::-webkit-scrollbar]:hidden bg-[#FFFAF4] h-full'
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'status'
            ? 'justify-center'
            : message.type === 'human'
              ? 'justify-end'
              : 'justify-start'
            }`}
        >
          {message.type === 'status' ? (
            <div className='px-3 py-1 rounded-lg bg-white shadow-sm text-[#393939]'>
              <p className='font-general-sans text-[15px] font-medium'>{message.content}</p>
            </div>
          ) : (
            <div className={`flex flex-col ${message.type === 'human' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3 rounded-2xl shadow-sm ${message.type === 'human'
                    ? message.file && message.file.type.startsWith('image/') && !message.content
                      ? ' text-black  rounded-br-[2px]' // Border only for image-only messages
                      : ' text-black bg-[#FFE1BE] rounded-md w-fit' // Background for text messages
                    : ' text-black bg-white max-w-[70%]  rounded-md'
                  }`}
              >
                {message.file && message.file.type.startsWith('image/') && message.file.previewUrl ? (
                  <div className='mb-2'>
                    <img
                      src={message.file.previewUrl}
                      alt={message.file.name}
                      className='max-w-[200px] max-h-[200px] object-cover rounded-lg'
                      onError={(e) => {
                        // Hide image if preview URL becomes invalid
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ) : null}

                {message.content && (
                  <p className='font-general-sans text-[16px] font-[400] w-fit'>{message.content}</p>
                )}

                {/* Product links display */}
                {message.type === 'product_links' && message.productLinks && (
                  renderProductLinks(message.productLinks)
                )}
              </div>
              
              {/* Timestamp */}
              <div className='mt-1 px-1'>
                <span className='font-general-sans text-[11px] text-[#666] font-[400]'>
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            </div>
          )}
        </div>
      ))
      }
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList