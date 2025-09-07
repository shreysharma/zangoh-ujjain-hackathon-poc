// User-friendly error messages for different HTTP status codes and scenarios

interface ErrorConfig {
  title: string
  message: string
  action?: string
}

const ERROR_MESSAGES: Record<string, ErrorConfig> = {
  // Network errors
  'NETWORK_ERROR': {
    title: 'Connection Problem',
    message: 'Unable to connect to our services. Please check your internet connection.',
    action: 'Try again'
  },
  'TIMEOUT': {
    title: 'Request Timeout',
    message: 'The request is taking too long. Please try again.',
    action: 'Retry'
  },
  
  // HTTP status codes
  '400': {
    title: 'Invalid Request',
    message: 'There was an error with your request. Please check your input and try again.',
  },
  '401': {
    title: 'Authentication Required',
    message: 'Please log in to continue.',
    action: 'Log in'
  },
  '403': {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
  },
  '404': {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
  },
  '409': {
    title: 'Conflict',
    message: 'There was a conflict with your request. Please try again.',
  },
  '422': {
    title: 'Invalid Data',
    message: 'The information provided is invalid. Please check and try again.',
  },
  '429': {
    title: 'Too Many Requests',
    message: 'You\'re making too many requests. Please wait a moment and try again.',
    action: 'Wait and retry'
  },
  '500': {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    action: 'Try again later'
  },
  '502': {
    title: 'Service Unavailable',
    message: 'Our services are temporarily unavailable. Please try again in a few minutes.',
    action: 'Try again later'
  },
  '503': {
    title: 'Service Unavailable',
    message: 'Our services are temporarily unavailable due to maintenance.',
    action: 'Try again later'
  },
  '504': {
    title: 'Gateway Timeout',
    message: 'The request timed out. Please try again.',
    action: 'Retry'
  },
  
  // Default fallback
  'DEFAULT': {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Try again'
  },
  
  // Specific application errors
  'LOGIN_FAILED': {
    title: 'Login Failed',
    message: 'Invalid username or password. Please check your credentials.',
  },
  'SESSION_EXPIRED': {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    action: 'Log in'
  },
  'API_UNREACHABLE': {
    title: 'Service Unavailable',
    message: 'We\'re unable to connect to our backend services right now.',
    action: 'Try again'
  },
}

export const getErrorMessage = (
  statusCode?: number | string, 
  errorType?: string, 
  fallbackMessage?: string
): ErrorConfig => {
  // Check for specific error type first
  if (errorType && ERROR_MESSAGES[errorType]) {
    return ERROR_MESSAGES[errorType]
  }
  
  // Check for HTTP status code
  if (statusCode && ERROR_MESSAGES[statusCode.toString()]) {
    return ERROR_MESSAGES[statusCode.toString()]
  }
  
  // Return default with fallback message if provided
  const defaultError = ERROR_MESSAGES['DEFAULT']
  if (fallbackMessage) {
    return {
      ...defaultError,
      message: fallbackMessage
    }
  }
  
  return defaultError
}

// Helper function for login-specific errors
export const getLoginErrorMessage = (error: any): string => {
  if (error?.status === 401) {
    return ERROR_MESSAGES['LOGIN_FAILED'].message
  }
  
  if (error?.status === 404) {
    return 'Login service is currently unavailable. Please try again later.'
  }
  
  if (error?.status >= 500) {
    return ERROR_MESSAGES['500'].message
  }
  
  if (error?.message?.includes('NetworkError') || error?.message?.includes('fetch')) {
    return ERROR_MESSAGES['NETWORK_ERROR'].message
  }
  
  if (error?.message?.includes('timeout')) {
    return ERROR_MESSAGES['TIMEOUT'].message
  }
  
  return ERROR_MESSAGES['DEFAULT'].message
}

// Helper function for API errors
export const getApiErrorMessage = (error: any): string => {
  const statusCode = error?.status || error?.response?.status
  const errorType = error?.type
  
  const errorConfig = getErrorMessage(statusCode, errorType)
  return errorConfig.message
}