import { NextRequest, NextResponse } from 'next/server'
import { config } from '../../../config/appConfig'

// Get CORS proxies from configuration
const corsProxies = config.externalServices.corsProxies
const indiamartDomain = config.indiamart.domain

async function fetchWithProxy(url: string, proxyUrl?: string): Promise<string | null> {
  const requestUrl = proxyUrl ? proxyUrl + encodeURIComponent(url) : url
  
  try {
    const response = await fetch(requestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    
    if (response.ok) {
      return await response.text()
    }
  } catch (error) {
    console.log('Fetch failed:', error)
  }
  
  return null
}

function extractImagesFromHtml(html: string): Array<{src: string, alt: string, className: string}> {
  const images: Array<{src: string, alt: string, className: string}> = []
  
  // Multiple regex patterns for different img tag formats
  const imgPatterns = [
    /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi,
    /<img[^>]+src=([^>\s]+)[^>]*>/gi,
    /data-src\s*=\s*["']([^"']+)["']/gi,
    /data-original\s*=\s*["']([^"']+)["']/gi
  ]
  
  imgPatterns.forEach(regex => {
    let match
    while ((match = regex.exec(html)) !== null) {
      const src = match[1].replace(/['"]/g, '')
      
      // Skip invalid sources
      if (!src || src.startsWith('data:') || src === '#' || src.length < 4) continue
      
      // Convert relative URLs to absolute
      let fullUrl = src
      if (src.startsWith('//')) {
        fullUrl = 'https:' + src
      } else if (src.startsWith('/')) {
        fullUrl = indiamartDomain + src
      } else if (!src.startsWith('http')) {
        fullUrl = indiamartDomain + '/' + src
      }
      
      // Extract alt and class attributes
      const imgTagStart = html.indexOf(match[0])
      const imgTagEnd = html.indexOf('>', imgTagStart) + 1
      const fullImgTag = html.substring(imgTagStart, imgTagEnd)
      
      const altMatch = fullImgTag.match(/alt\s*=\s*["']([^"']*)["']/i)
      const classMatch = fullImgTag.match(/class\s*=\s*["']([^"']*)["']/i)
      
      // Check for duplicates
      if (!images.some(img => img.src === fullUrl)) {
        images.push({
          src: fullUrl,
          alt: altMatch ? altMatch[1] : '',
          className: classMatch ? classMatch[1] : ''
        })
      }
    }
  })
  
  return images
}

function isProductImage(src: string, alt: string, className: string): boolean {
  const productIndicators = [
    'data4', 'data5', 'data3', 'data2', 'data1', // IndiaMART CDN patterns
    'product', 'item', 'main', 'primary', 'gallery',
    'img_', 'prod_', 'item_', 'photo', 'image',
    'thumb', 'preview', 'zoom', 'imageslid', 'pdp_enq',
    '1000x1000', '500x500', '250x250' // Common product image sizes
  ]
  
  const nonProductIndicators = [
    'logo', 'icon', 'button', 'arrow', 'banner',
    'header', 'footer', 'nav', 'menu', 'social',
    'whatsapp', 'call', 'email', 'contact', 'chat',
    'sprite', 'bg', 'background', 'avatar', 'profile',
    'c_logo', '90x90', '125x125' // Small thumbnail sizes
  ]
  
  const srcLower = src.toLowerCase()
  const altLower = alt.toLowerCase()
  const classLower = className.toLowerCase()
  
  // Check for non-product indicators first
  if (nonProductIndicators.some(indicator => 
    srcLower.includes(indicator) || altLower.includes(indicator) || classLower.includes(indicator)
  )) {
    return false
  }
  
  // Check for product indicators
  return productIndicators.some(indicator => 
    srcLower.includes(indicator) || altLower.includes(indicator) || classLower.includes(indicator)
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }
  
  if (!url.includes('indiamart.com')) {
    return NextResponse.json({ error: 'Only IndiaMART URLs are supported' }, { status: 400 })
  }
  
  try {
    let html: string | null = null
    let usedMethod = ''
    
    // Try direct fetch first
    html = await fetchWithProxy(url)
    if (html) {
      usedMethod = 'Direct fetch'
    } else {
      // Try CORS proxies
      for (const proxy of corsProxies) {
        html = await fetchWithProxy(url, proxy)
        if (html) {
          usedMethod = `Proxy: ${proxy}`
          break
        }
      }
    }
    
    if (!html) {
      return NextResponse.json({ 
        error: 'Failed to fetch content from URL',
        url,
        success: false
      }, { status: 500 })
    }
    
    // Extract images
    const images = extractImagesFromHtml(html)
    const productImages = images.filter(img => isProductImage(img.src, img.alt, img.className))
    
    // Get best quality image
    let bestImage = null
    if (productImages.length > 0) {
      // Prefer high-resolution images
      bestImage = productImages.find(img => 
        img.src.includes('1000x1000') || img.src.includes('500x500')
      ) || productImages[0]
    } else if (images.length > 0) {
      // If no product images detected, try to find the best image anyway
      // Look for high-quality images that might be products
      bestImage = images.find(img => 
        (img.src.includes('1000x1000') || img.src.includes('500x500')) &&
        !img.src.toLowerCase().includes('logo') &&
        !img.src.toLowerCase().includes('icon')
      ) || images.find(img => 
        !img.src.toLowerCase().includes('logo') &&
        !img.src.toLowerCase().includes('icon') &&
        !img.src.toLowerCase().includes('90x90') &&
        !img.src.toLowerCase().includes('125x125')
      ) || images[0]
    }
    
    return NextResponse.json({
      success: true,
      url,
      method: usedMethod,
      bestImage: bestImage?.src || null,
      totalImages: images.length,
      productImages: productImages.length,
      allProductImages: productImages.map(img => img.src),
      allImages: images.map(img => ({ src: img.src, alt: img.alt, className: img.className })) // Debug info
    })
    
  } catch (error) {
    console.error('Image extraction error:', error)
    return NextResponse.json({ 
      error: 'Failed to extract images',
      url,
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}