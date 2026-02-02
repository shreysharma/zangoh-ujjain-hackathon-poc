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

function extractProductDetails(html: string) {
  const productData = {
    price: '',
    images: [] as string[],
    company: '',
    location: '',
    description: '',
    specifications: {} as Record<string, string>,
    rating: '',
    minOrder: '',
    availability: '',
    productName: ''
  }

  // Extract price - look for patterns with ₹ symbol
  const pricePatterns = [
    /₹[\s]*[\d,]+(?:\.[\d]+)?(?:\s*\/\s*[a-zA-Z\s]+)?/g,
    /Rs\.?[\s]*[\d,]+(?:\.[\d]+)?(?:\s*\/\s*[a-zA-Z\s]+)?/g,
    /INR[\s]*[\d,]+(?:\.[\d]+)?(?:\s*\/\s*[a-zA-Z\s]+)?/g
  ]

  for (const pattern of pricePatterns) {
    const matches = html.match(pattern)
    if (matches && matches.length > 0) {
      // Find the most likely price (usually the first substantial one)
      const validPrices = matches.filter(price => {
        const numValue = parseInt(price.replace(/[^\d]/g, ''))
        return numValue > 10 && numValue < 10000000 // Reasonable price range
      })
      if (validPrices.length > 0) {
        productData.price = validPrices[0].trim()
        break
      }
    }
  }

  // Extract images (reuse logic from extract-image endpoint)
  const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi
  let imgMatch
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    let src = imgMatch[1]
    
    // Skip invalid sources
    if (!src || src.startsWith('data:') || src === '#' || src.length < 4) continue
    
    // Convert relative URLs to absolute
    if (src.startsWith('//')) {
      src = 'https:' + src
    } else if (src.startsWith('/')) {
      src = indiamartDomain + src
    } else if (!src.startsWith('http')) {
      src = indiamartDomain + '/' + src
    }
    
    // Filter for product images
    if (src.includes('imimg.com') && 
        (src.includes('data4') || src.includes('data5') || src.includes('data3')) &&
        !src.toLowerCase().includes('logo') &&
        !src.toLowerCase().includes('icon')) {
      productData.images.push(src)
    }
  }

  // Extract company name
  const companyPatterns = [
    /"companyName":\s*"([^"]+)"/,
    /company[^>]*>([^<]+)</i,
    /seller[^>]*>([^<]+)</i,
    /vendor[^>]*>([^<]+)</i
  ]
  
  for (const pattern of companyPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      productData.company = match[1].trim()
      break
    }
  }

  // Extract location/city
  const locationPatterns = [
    /"cityName":\s*"([^"]+)"/,
    /location[^>]*>([^<]+)</i,
    /city[^>]*>([^<]+)</i,
    /address[^>]*>([^<]+)</i
  ]
  
  for (const pattern of locationPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      productData.location = match[1].trim()
      break
    }
  }

  // Extract minimum order
  const moqPatterns = [
    /minimum[\s]*order[^>]*>([^<]+)</i,
    /MOQ[^>]*>([^<]+)</i,
    /Min[\s]*Order[^>]*>([^<]+)</i,
    /[\d]+[\s]*piece/i
  ]
  
  for (const pattern of moqPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      productData.minOrder = match[1].trim()
      break
    }
  }

  // Extract rating
  const ratingPatterns = [
    /rating[^>]*>([^<]*[\d\.]+[^<]*)</i,
    /star[^>]*>([^<]*[\d\.]+[^<]*)</i,
    /([\d\.]+)[\s]*star/i
  ]
  
  for (const pattern of ratingPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const ratingMatch = match[1].match(/[\d\.]+/)
      if (ratingMatch) {
        productData.rating = ratingMatch[0]
        break
      }
    }
  }

  // Extract product name
  const productNamePatterns = [
    // JSON data patterns
    /"productName":\s*"([^"]+)"/,
    /"name":\s*"([^"]+)"/,
    /"title":\s*"([^"]+)"/,
    // HTML title tag
    /<title[^>]*>([^<]+(?:at best price|from|by|in).*?)<\/title>/i,
    /<title[^>]*>([^<]+)<\/title>/i,
    // HTML heading patterns
    /<h1[^>]*>([^<]+)</i,
    /<h2[^>]*>([^<]+)</i,
    // Product name in various containers
    /product[^>]*name[^>]*>([^<]+)</i,
    /name[^>]*product[^>]*>([^<]+)</i,
    // Meta tags
    /<meta[^>]*property\s*=\s*["']og:title["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /<meta[^>]*name\s*=\s*["']title["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    // Breadcrumb patterns
    /breadcrumb[^>]*>.*?<[^>]*>([^<]+)</i
  ]
  
  for (const pattern of productNamePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      let productName = match[1].trim()
      
      // Clean up the product name
      productName = productName
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/^\s*-\s*/, '') // Remove leading dash
        .replace(/\s*-\s*$/, '') // Remove trailing dash
        .replace(/\s*\|\s*.*$/, '') // Remove everything after pipe symbol
        .replace(/\s*at best price.*$/i, '') // Remove "at best price" suffix
        .replace(/\s*from.*$/i, '') // Remove "from" suffix
        .replace(/\s*by.*$/i, '') // Remove "by" suffix
        .replace(/\s*in.*$/i, '') // Remove "in" suffix
        .replace(/^IndiaMART\s*-?\s*/i, '') // Remove IndiaMART prefix
        .trim()
      
      // Validate the product name
      if (productName.length > 3 && 
          productName.length < 200 && 
          !productName.toLowerCase().includes('indiamart') &&
          !productName.toLowerCase().includes('login') &&
          !productName.toLowerCase().includes('register') &&
          !productName.toLowerCase().includes('search')) {
        productData.productName = productName
        break
      }
    }
  }

  return productData
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
    
    // Extract product details
    const productData = extractProductDetails(html)
    
    return NextResponse.json({
      success: true,
      url,
      method: usedMethod,
      data: productData
    })
    
  } catch (error) {
    console.error('Product extraction error:', error)
    return NextResponse.json({ 
      error: 'Failed to extract product details',
      url,
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}