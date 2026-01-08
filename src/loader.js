import axios from 'axios'
import axiosDebug from 'axios-debug-log'
import path from 'path'
import fs from 'fs/promises'
import * as cheerio from 'cheerio'
import { getHtmlFileName, getDirName, getImgName } from './utils/file-name.js'
import { log } from './logger.js'
// import { log, logParser, logFs, logError } from './logger.js'

// todo:  getImgName - изменить на более универсальное для ссылок/картинок/медиа

axiosDebug(axios)

function getHtmlPage(url, dir = process.cwd()) {
  return axios.get(url)
    .then((response) => {
      const fileName = getHtmlFileName(url)
      const filePath = path.join(dir, fileName)
      return fs.writeFile(filePath, response.data)
        .then(() => ({
          filePath,
          htmlContent: response.data,
        }))
    })
    .catch((error) => {
      console.error('Ошибка загрузки страницы:', error.message)
      throw error
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
    .then(response => fs.writeFile(resourcePath, response.data))
    .then(() => ({
      originalUrl: resourceUrl,
      localPath: resourcePath,
      status: 'success',
    }))
    .catch(error => ({
      originalUrl: resourceUrl,
      error: error.message,
      status: 'failed',
    }))
}

function pageloader(url, dir = process.cwd()) {
  // log('=== Starting pageloader ===')
  // log('Output directory: %s', dir)

  let htmlData
  let $
  let dirPath

  return fs.mkdir(dir, { recursive: true })
    .then(() => getHtmlPage(url, dir))
    .then((result) => {
      htmlData = result
      const dirName = getDirName(url)
      dirPath = path.join(dir, dirName)
      return fs.mkdir(dirPath, { recursive: true })
    })
    .then(() => {
      $ = cheerio.load(htmlData.htmlContent)

      const localResources = []
      $('img').each((i, element) => {
        const src = $(element).attr('src')
        if (src && isLocalResource(url, src)) {
          const fullResourceUrl = new URL(src, url).href
          const resourceName = getImgName(url, src)
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
          const resourceName = getImgName(url, href)
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
          const resourceName = getImgName(url, src)
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
    })
    .then(() => ({
      htmlFilePath: htmlData.filePath,
      dirName: path.basename(dirPath),
      dirPath,
    }))
    .catch((error) => {
      console.error('Ошибка в pageloader:', error.message)
      throw error
    })
}

export { pageloader }
