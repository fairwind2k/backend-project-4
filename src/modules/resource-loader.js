import axios from "axios"
import path from 'path'
import fs from 'fs/promises'
import { validateHttpResponse } from "../utils/validators"
import { handleFileWriteError, handleHttpError } from "../errors/handlers"

const downloadResource = (resourceUrl, resourcePath) => {
  let responseData
  
  return axios.get(resourceUrl, { responseType: 'arraybuffer' })
    .then((response) => validateHttpResponse(response, resourceUrl))
    .then((response) => {
      responseData = response.data
      return responseData
    })
    .then((data) => fs.writeFile(resourcePath, data))
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
        handleFileWriteError(error, resourcePath, dir)
      } else if (error.code === 'HTTP_ERROR' || error.response || error.request) {
        handleHttpError(error, resourceUrl)
      } else {
        throw error
      }
    })
}

export  { downloadResource }
