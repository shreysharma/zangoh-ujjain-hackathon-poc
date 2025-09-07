/**
 * Service to fetch and extract product images from IndiaMART URLs
 */

interface ImageExtractionResult {
  productImages: string[]
  allImages: string[]
  success: boolean
  error?: string
}

class ImageService {
  private corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
  ]

  /**
   * Extract images from IndiaMART product URL
   */
  async extractImagesFromUrl(url: string): Promise<ImageExtractionResult> {
    try {
      // Try to fetch HTML content
      const html = await this.fetchHtmlContent(url)
      
      if (!html) {
        return {
          productImages: [],
          allImages: [],
          success: false,
          error: 'Failed to fetch page content'
        }
      }

      // Extract images from HTML
      const images = this.extractImagesFromHtml(html)
      
      // Filter product images
      const productImages = images.filter(img => this.isProductImage(img.src, img.alt, img.className))
      
      return {
        productImages: productImages.map(img => img.src),
        allImages: images.map(img => img.src),
        success: true
      }
    } catch (error) {
      console.error('Image extraction failed:', error)
      return {
        productImages: [],
        allImages: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get best product image from URL
   */
  async getBestProductImage(url: string): Promise<string | null> {
    const result = await this.extractImagesFromUrl(url)
    
    if (result.success && result.productImages.length > 0) {
      // Return the first high-quality product image
      const highQualityImage = result.productImages.find(img => 
        img.includes('1000x1000') || img.includes('500x500')
      )
      return highQualityImage || result.productImages[0]
    }
    
    return null
  }

  private async fetchHtmlContent(url: string): Promise<string | null> {
    // Try direct fetch first
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (response.ok) {
        return await response.text()
      }
    } catch (error) {
      console.log('Direct fetch failed, trying proxies...')
    }

    // Try CORS proxies
    for (const proxy of this.corsProxies) {
      try {
        const response = await fetch(proxy + encodeURIComponent(url), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          return await response.text()
        }
      } catch (error) {
        console.log(`Proxy ${proxy} failed:`, error)
        continue
      }
    }

    return null
  }

  private extractImagesFromHtml(html: string): Array<{src: string, alt: string, className: string}> {
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
          fullUrl = 'https://www.indiamart.com' + src
        } else if (!src.startsWith('http')) {
          fullUrl = 'https://www.indiamart.com/' + src
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

  private isProductImage(src: string, alt: string, className: string): boolean {
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
}

export const imageService = new ImageService()