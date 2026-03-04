
const isValidUrl = (url) => {
  if (typeof url !== 'string') {
    const error = new Error('URL must be a string')
    error.code = 'INVALID_TYPE'
    throw error
  }
  try {
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      const error = new Error(`Unsupported protocol: ${urlObj.protocol}`)
      error.code = 'INVALID_PROTOCOL'
      throw error
    }
    return urlObj
  } catch (error) {
    if (error.code === 'INVALID_PROTOCOL') {
      throw error
    }
    const invalidError = new Error(`Invalid URL: ${url}`, { cause: error })
    invalidError.code = 'INVALID_URL'
    throw invalidError
  }
}

const validateHttpResponse = (response, url) => {
  if (response.status !== 200) {
    const error = new Error(`HTTP ${response.status}: Failed to load page`)
    error.code = 'HTTP_ERROR'
    throw error
  }
  return response
}

const isLocalResource = (pageUrl, resourceSrc) => {
  try {
    const pageHost = new URL(pageUrl).hostname
    const resourceUrl = new URL(resourceSrc, pageUrl)
    const resourceHost = resourceUrl.hostname

    return resourceHost === pageHost || resourceHost.endsWith(`.${pageHost}`)
  } catch {
    return false
  }
}



export { 
  isValidUrl,
  validateHttpResponse,
  isLocalResource
 }
