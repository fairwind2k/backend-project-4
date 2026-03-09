import axios from 'axios'
import fs from 'fs/promises'
import { validateHttpResponse } from '../utils/validators.js'
import { prepareFileData } from '../utils/parsers.js'
import { handleFileWriteError, handleHttpError } from '../errors/handlers.js'

function getHtmlPage(url, dir = process.cwd()) {
  let fileData

  return axios.get(url)
    .then(response => validateHttpResponse(response, url))
    .then((response) => {
      fileData = prepareFileData(response, url, dir)
      return fileData
    })
    .then(data => fs.writeFile(data.filePath, data.data))
    .then(() => ({
      filePath: fileData.filePath,
      htmlContent: fileData.htmlContent,
    }))
    .catch((error) => {
      if (error.code === 'EACCES' || error.code === 'ENOENT') {
        return handleFileWriteError(error, fileData?.filePath || 'unknown', dir)
      }
      return handleHttpError(error, url)
    })
}

export default getHtmlPage
