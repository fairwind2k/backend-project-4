import axios from 'axios'
import axiosDebug from 'axios-debug-log'
import path from 'path'
import fs from 'fs/promises'
import * as cheerio from 'cheerio'
import { getHtmlFileName, getDirName, getAssetPath } from './utils/file-name.js'
import { log } from './logger.js'
import { createTestScheduler } from 'jest'
// import { error } from 'console'
// import { log, logParser, logFs, logError } from './logger.js'

axiosDebug(axios)

function getHtmlPage(url, dir = process.cwd()) {
  return axios.get(url)
    .then((response) => {
      if (response.status !== 200) {
        const error = new Error(`HTTP ${response.status}: Failed to load page`)
        error.code = 'HTTP_ERROR'
        throw error
      }
      const fileName = getHtmlFileName(url)
      const filePath = path.join(dir, fileName)

      return fs.writeFile(filePath, response.data)
        .then(() => ({
          filePath,
          htmlContent: response.data,
        }))
        .catch((error) => {
          if (error.code === 'EACCES') {
            console.error(`Error: Permission denied. Cannot write file to ${filePath}`)
          }
          else if (error.code === 'ENOENT') {
            console.error(`Error: Directory does not exist: ${dir}`)
          }
          else {
            console.error(`Error: Failed to save HTML file: ${error.message}`)
          }
          throw error
        })
    })
    .catch((error) => {
      if (error.code === 'HTTP_ERROR') {
        throw error
      }
      else if (error.response) {
        console.error(`Error: Failed to load page ${url}. HTTP status: ${error.response.status}`)
        const httpError = new Error(`HTTP ${error.response.status}`)
        httpError.code = 'HTTP_ERROR'
        throw httpError
      }
      else if (error.request) {
        console.error(`Error: No response from ${url}. Check your network connection.`)
        const networkError = new Error('Network error')
        networkError.code = 'NETWORK_ERROR'
        throw networkError
      }
      else if (error.code === 'EACCES' || error.code === 'ENOENT') {
        throw error
      }
      else {
        console.error(`Error: Failed to load page ${url}: ${error.message}`)
        throw error
      }
    })
};

const isLocalResource = (pageUrl, resourceSrc) => {
  try {
    const pageHost = new URL(pageUrl).hostname
    const resourceUrl = new URL(resourceSrc, pageUrl)
    const resourceHost = resourceUrl.hostname

    return resourceHost === pageHost || resourceHost.endsWith(`.${pageHost}`)
  }
  catch {
    return false
  }
}

const downloadResource = (resourceUrl, resourcePath) => {
  return axios.get(resourceUrl, { responseType: 'arraybuffer' })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`)
      }
      return fs.writeFile(resourcePath, response.data)
    })
    .then(() => ({
      originalUrl: resourceUrl,
      localPath: resourcePath,
      status: 'success',
    }))
    .catch((error) => {
      let errorMessage = error.message

      if (error.response) {
        errorMessage = `HTTP ${error.response.status}`
      }
      else if (error.request) {
        errorMessage = 'Network error'
      }
      else if (error.code === 'EACCES') {
        errorMessage = 'Permission denied'
      }
      else if (error.code === 'ENOENT') {
        errorMessage = 'Directory does not exist'
      }

      console.error(`Warning: Failed to download resource ${resourceUrl}: ${errorMessage}`)

      throw err
    })
}

function pageloader(url, dir = process.cwd()) {
  log('=== Starting pageloader ===')
  log('Output directory: %s', dir)

  let htmlData
  let $
  let dirPath

  return fs.access(dir)
    .catch((error) => {
      if (error.code === 'ENOENT') {
        throw new Error('Directory does not exist')
      }
      throw error
    })
    .then(() => fs.mkdir(dir, { recursive: true }))
    .catch((error) => {
      if (error.code === 'EACCES') {
        console.error(`Error: Permission denied. Cannot create directory ${dir}`)
      }
      else if (error.code === 'ENOTDIR') {
        console.error(`Error: ${dir} exists but is not a directory`)
      }
      else {
        console.error(`Error: Failed to create directory ${dir}: ${error.message}`)
      }
      throw error
    })
    .then(() => getHtmlPage(url, dir))
    .then((result) => {
      htmlData = result
      const dirName = getDirName(url)
      dirPath = path.join(dir, dirName)

      return fs.mkdir(dirPath, { recursive: true })
        .catch((error) => {
          if (error.code === 'EACCES') {
            console.error(`Error: Permission denied. Cannot create directory ${dirPath}`)
          }
          else if (error.code === 'ENOTDIR') {
            console.error(`Error: ${dirPath} exists but is not a directory`)
          }
          else {
            console.error(`Error: Failed to create resourses directory ${dirPath}: ${error.message}`)
          }
          throw error
        })
    })
    .then(() => {
      $ = cheerio.load(htmlData.htmlContent)

      const localResources = []
      $('img').each((i, element) => {
        const src = $(element).attr('src')
        if (src && isLocalResource(url, src)) {
          const fullResourceUrl = new URL(src, url).href
          const resourceName = getAssetPath(url, src)
          const resourcePath = path.join(dir, resourceName)

          localResources.push({
            element,
            tagName: 'img',
            attrName: 'src',
            originalValue: src,
            fullUrl: fullResourceUrl,
            localPath: resourcePath,
            relativePath: resourceName,
          })
        }
      })

      $('link').each((i, element) => {
        const href = $(element).attr('href')
        if (href && isLocalResource(url, href)) {
          const fullResourceUrl = new URL(href, url).href
          const resourceName = getAssetPath(url, href)
          const resourcePath = path.join(dir, resourceName)

          localResources.push({
            element,
            tagName: 'link',
            attrName: 'href',
            originalValue: href,
            fullUrl: fullResourceUrl,
            localPath: resourcePath,
            relativePath: resourceName,
          })
        }
      })

      $('script').each((i, element) => {
        const src = $(element).attr('src')
        if (src && isLocalResource(url, src)) {
          const fullResourceUrl = new URL(src, url).href
          const resourceName = getAssetPath(url, src)
          const resourcePath = path.join(dir, resourceName)

          localResources.push({
            element,
            tagName: 'script',
            attrName: 'src',
            originalValue: src,
            fullUrl: fullResourceUrl,
            localPath: resourcePath,
            relativePath: resourceName,
          })
        }
      })

      // log('Found %d local resources to download', localResources.length)

      const downloadPromises = localResources.map(resource =>
        downloadResource(resource.fullUrl, resource.localPath),
      )

      return Promise.all(downloadPromises)
        .then(downloadResults => ({ localResources, downloadResults }))
    })
    .then(({ localResources, downloadResults }) => {
      localResources.forEach((resource, index) => {
        const downloadResult = downloadResults[index]
        if (downloadResult.status === 'success') {
          $(resource.element).attr(resource.attrName, resource.relativePath)
        }
      })

      const updatedHtml = $.html()
      return fs.writeFile(htmlData.filePath, updatedHtml)

        .catch((error) => {
          if (error.code === 'EACCES') {
            console.error(`Error: Permission denied. Cannot update HTML file ${htmlData.filePath}`)
          }
          else if (error.code === 'ENOENT') {
            console.error(`Error: Directory does not exist for file ${htmlData.filePath}`)
          }
          else {
            console.error(`Error: Failed to update HTML file: ${error.message}`)
          }
          throw error
        })
    })
    .then(() => ({
      htmlFilePath: htmlData.filePath,
      dirName: path.basename(dirPath),
      dirPath,
    }))
    .catch((error) => {
      throw error
    })
}

export { pageloader }
