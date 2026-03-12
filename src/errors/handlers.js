const handleHttpError = (error, url) => {
  if (error.code === 'HTTP_ERROR') {
    throw error
  }

  if (error.response) {
    const httpError = new Error(`HTTP ${error.response.status}: Failed to load ${url}`)
    httpError.code = 'HTTP_ERROR'
    throw httpError
  }

  if (error.request) {
    const networkError = new Error(`Network error: No response from ${url}`)
    networkError.code = 'NETWORK_ERROR'
    throw networkError
  }

  throw error
}

const handleFileWriteError = (error, filePath, dir) => {
  if (error.code === 'EACCES') {
    const permError = new Error(`Permission denied: Cannot write file to ${filePath}`)
    permError.code = 'EACCES'
    throw permError
  }

  if (error.code === 'ENOENT') {
    const dirError = new Error(`Directory does not exist: ${dir}`)
    dirError.code = 'ENOENT'
    throw dirError
  }

  throw error
}

const createErrorResult = (error, resourceUrl, resourcePath) => {
  return {
    originalUrl: resourceUrl,
    localPath: resourcePath,
    status: 'error',
    error,
  }
}

export { handleFileWriteError, handleHttpError, createErrorResult }
