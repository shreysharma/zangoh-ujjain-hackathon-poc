import React from 'react'
import { Message, ProductLink } from '../hooks/useConversation'
import TypingText from './TypingText'

interface ConversationDisplayProps {
  messages: Message[]
  className?: string
}

const ConversationDisplay = ({ messages, className = '' }: ConversationDisplayProps) => {
  const formatStructuredContent = (content: string) => {
    // Handle numbered lists
    const numberedListRegex = /^(\d+)\.\s+(.+)$/gm
    const bulletListRegex = /^[-•*]\s+(.+)$/gm
    
    // Split content into paragraphs
    const paragraphs = content.split('\n\n')
    
    return paragraphs.map((paragraph, index) => {
      // Check if paragraph is a numbered list
      const numberedMatches = [...paragraph.matchAll(numberedListRegex)]
      if (numberedMatches.length > 0) {
        return (
          <div key={index} className="mb-4">
            <div className="space-y-2">
              {numberedMatches.map((match, listIndex) => (
                <div key={listIndex} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#1976d2] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {match[1]}
                  </span>
                  <span className="flex-1 text-[16px] leading-[1.6]">{match[2]}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
      
      // Check if paragraph is a bullet list
      const bulletMatches = [...paragraph.matchAll(bulletListRegex)]
      if (bulletMatches.length > 0) {
        return (
          <div key={index} className="mb-4">
            <div className="space-y-2">
              {bulletMatches.map((match, listIndex) => (
                <div key={listIndex} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-2 h-2 bg-[#1976d2] rounded-full mt-2"></span>
                  <span className="flex-1 text-[16px] leading-[1.6]">{match[1]}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
      
      // Handle single line numbered items
      const singleLineNumbered = paragraph.match(/^(\d+)\.\s+(.+)$/)
      if (singleLineNumbered) {
        return (
          <div key={index} className="mb-3 flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#1976d2] text-white rounded-full flex items-center justify-center text-sm font-medium">
              {singleLineNumbered[1]}
            </span>
            <span className="flex-1 text-[16px] leading-[1.6]">{singleLineNumbered[2]}</span>
          </div>
        )
      }
      
      // Regular paragraph
      return (
        <p key={index} className="mb-3 text-[16px] leading-[1.6]">
          {paragraph}
        </p>
      )
    })
  }

  const renderProductLinks = (links: ProductLink[], functionName?: string) => {
    if (!links || links.length === 0) return null


    // Group links by source for better organization
    const productLinks = links.filter(link => link.source === 'search_products_with_images')
    const supplierLinks = links.filter(link => link.source === 'search_suppliers')

    return (
      <div className="mt-3 space-y-4">
        <div className="text-sm font-medium text-[#1976d2] mb-2">
          🔍 {functionName === 'combined_search' ? 'Product & Supplier Results' : 'Search Results'}
        </div>
        
        {/* Product Cards Section */}
        {productLinks.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-[#666] mb-3">
              🖼️ Product Listings ({productLinks.length})
            </div>
            <div className='w-full min-h-[400px] gap-3 flex overflow-x-auto pt-2 pb-2 [&::-webkit-scrollbar]:hidden'
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {productLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='min-w-[250px] min-h-full bg-[#EEF6F5] rounded-[15px] border border-[#D9D9D9] p-3 hover:shadow-lg transition-shadow cursor-pointer'
                >
                  <div className='w-full h-[65%] bg-white rounded-[12px] border border-[#D9D9D9] overflow-hidden'>
                    <img 
                      src={link.image_url || "./pr.png"} 
                      alt={link.title}
                      className='w-full h-full object-cover rounded-[12px]' 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "./pr.png"
                      }}
                    />
                  </div>
                  <div className='w-full min-h-[35%] mt-3 rounded-[12px]'>
                    <h1 className='text-black text-[14px] font-[500] font-general-sans m-3 line-clamp-2'>
                      {link.title}
                    </h1>
                    <h2 className='text-[#565656] text-[12px] font-[400] font-general-sans m-3'>
                      Seller: {link.company || 'IndiaMART'}
                    </h2>
                    <h3 className='text-[#002866] text-[14px] font-[600] font-general-sans m-3'>
                      View Product →
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Supplier Cards Section */}
        {supplierLinks.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-[#666] mb-3">
              🏭 Direct Suppliers ({supplierLinks.length})
            </div>
            <div className='w-full min-h-[400px] gap-3 flex overflow-x-auto pt-2 pb-2 [&::-webkit-scrollbar]:hidden'
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {supplierLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='min-w-[250px] min-h-full bg-[#FFF8E1] rounded-[15px] border border-[#FFE082] p-3 hover:shadow-lg transition-shadow cursor-pointer'
                >
                  <div className='w-full h-[65%] bg-white rounded-[12px] border border-[#D9D9D9] flex items-center justify-center'>
                    <div className='text-center p-4'>
                      <div className='w-16 h-16 bg-[#FF9800] rounded-full flex items-center justify-center mx-auto mb-2'>
                        <span className='text-white text-2xl'>🏭</span>
                      </div>
                      <div className='text-[#002866] text-[12px] font-[500]'>
                        Rating: {link.rating || 'N/A'}⭐
                      </div>
                    </div>
                  </div>
                  <div className='w-full min-h-[35%] mt-3 rounded-[12px]'>
                    <h1 className='text-black text-[14px] font-[500] font-general-sans m-3 line-clamp-2'>
                      {link.company || 'Supplier'}
                    </h1>
                    <h2 className='text-[#565656] text-[12px] font-[400] font-general-sans m-3'>
                      Location: {link.city || 'India'}
                    </h2>
                    <h3 className='text-[#002866] text-[14px] font-[600] font-general-sans m-3'>
                      Contact Supplier →
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Single tool results - card layout */}
        {functionName !== 'combined_search' && (
          <div className='w-full min-h-[400px] gap-3 flex overflow-x-auto pt-2 pb-2 [&::-webkit-scrollbar]:hidden'
               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {links.map((link, index) => (
              <a 
                key={index}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`min-w-[250px] min-h-full rounded-[15px] border p-3 hover:shadow-lg transition-shadow cursor-pointer ${
                  link.source === 'search_suppliers' 
                    ? 'bg-[#FFF8E1] border-[#FFE082]' 
                    : 'bg-[#EEF6F5] border-[#D9D9D9]'
                }`}
              >
                <div className='w-full h-[65%] bg-white rounded-[12px] border border-[#D9D9D9] overflow-hidden'>
                  {link.source === 'search_products_with_images' ? (
                    <img 
                      src={link.image_url || "./pr.png"} 
                      alt={link.title}
                      className='w-full h-full object-cover rounded-[12px]' 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "./pr.png"
                      }}
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='w-16 h-16 bg-[#FF9800] rounded-full flex items-center justify-center mx-auto mb-2'>
                          <span className='text-white text-2xl'>🏭</span>
                        </div>
                        <div className='text-[#002866] text-[12px] font-[500]'>
                          Rating: {link.rating || 'N/A'}⭐
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className='w-full min-h-[35%] mt-3 rounded-[12px]'>
                  <h1 className='text-black text-[14px] font-[500] font-general-sans m-3 line-clamp-2'>
                    {link.source === 'search_suppliers' ? (link.company || 'Supplier') : link.title}
                  </h1>
                  <h2 className='text-[#565656] text-[12px] font-[400] font-general-sans m-3'>
                    {link.source === 'search_suppliers' 
                      ? `Location: ${link.city || 'India'}`
                      : `Seller: ${link.company || 'IndiaMART'}`
                    }
                  </h2>
                  <h3 className='text-[#002866] text-[14px] font-[600] font-general-sans m-3'>
                    {link.source === 'search_suppliers' ? 'Contact Supplier →' : 'View Product →'}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  const getMessageBgColor = (message: Message) => {
    switch (message.type) {
      case 'human':
        return 'bg-[#269697] text-white rounded-br-sm'
      case 'status':
        return 'bg-[#FFF3CD] text-[#856404] border border-[#FFEAA7] rounded-lg'
      case 'tool':
        return 'bg-[#E3F2FD] text-[#1976D2] border border-[#BBDEFB] rounded-lg'
      case 'product_links':
        return 'bg-[#F0F8FF] text-[#282828] border border-[#B6D7FF] rounded-lg'
      default:
        return 'bg-[#F4F4F4] text-[#282828] rounded-bl-sm'
    }
  }

  return (
    <div className={`w-full h-full overflow-y-auto p-4 space-y-4 ${className}`}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'human' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[80%] p-4 rounded-2xl ${getMessageBgColor(message)}`}>
            {/* Message content */}
            {message.type === 'bot' && message.isStreaming ? (
              <TypingText 
                text={message.content}
                className="font-general-sans text-[16px] leading-[1.6]"
              />
            ) : (
              <div className="font-general-sans">
                {message.type === 'bot' ? (
                  <div>
                    {formatStructuredContent(message.content)}
                    {message.isAudio && <span className="ml-2 text-xs opacity-70">(spoken)</span>}
                  </div>
                ) : (
                  <p className="text-[16px] leading-[1.6]">
                    {message.content}
                    {message.isAudio && <span className="ml-2 text-xs opacity-70">(spoken)</span>}
                  </p>
                )}
              </div>
            )}

            {/* File attachment display */}
            {message.file && (
              <div className="mt-3">
                {message.file.type.startsWith('image/') ? (
                  <img 
                    src={message.file.url} 
                    alt={message.file.name}
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                    style={{ maxHeight: '200px' }}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                    <span className="text-sm">📎</span>
                    <span className="text-sm">{message.file.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Product links display */}
            {message.type === 'product_links' && message.productLinks && (
              renderProductLinks(message.productLinks)
            )}

            <span className="text-xs opacity-70 mt-2 block">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ConversationDisplay