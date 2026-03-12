import axios from 'axios'
import path from 'path'
import fs from 'fs/promises'
import { validateHttpResponse } from '../utils/validators.js'
import { createErrorResult } from '../errors/handlers.js'

const downloadResource = (resourceUrl, resourcePath) => {
  let responseData

  return axios.get(resourceUrl, { responseType: 'arraybuffer' })
    .then(response => validateHttpResponse(response))
    .then((response) => {
      responseData = response.data
      return responseData
    })
    .then(data => fs.writeFile(resourcePath, data))
    .then(() => {
      return {
        originalUrl: resourceUrl,
        localPath: resourcePath,
        status: 'success',
      }
    })
    .catch((error) => {
      if (error.code === 'EACCES' || error.code === 'ENOENT') {
        const dir = path.dirname(resourcePath)
        const fsError = new Error(`Directory does not exist: ${dir}`)
        fsError.code = error.code
        return createErrorResult(fsError, resourceUrl, resourcePath)
      }
      if (error.response) {
        const httpError = new Error(`HTTP ${error.response.status}: Failed to load ${resourceUrl}`)
        httpError.code = 'HTTP_ERROR'
        return createErrorResult(httpError, resourceUrl, resourcePath)
      }
      if (error.code === 'HTTP_ERROR' || error.request) {
        return createErrorResult(error, resourceUrl, resourcePath)
      }
      return createErrorResult(error, resourceUrl, resourcePath)
    })
}

export { downloadResource }
