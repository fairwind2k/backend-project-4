import axios from 'axios'
import axiosDebug from 'axios-debug-log'
import path from 'path'
import fs from 'fs/promises'
import * as cheerio from 'cheerio'
import { getHtmlFileName, getDirName, getImgName } from './utils/file-name.js'
import { log, logParser, logFs, logError } from './logger.js'

// const gettmlFileName = (url) => `${formattedPath(url).newPath}.html`;

// const getDirName = (url) => `${formattedPath(url).newPath}_files`;

// const formattedImgName = (src) => {
//   const imgName = `${path.parse(src).dir}/${path.parse(src).name}`;
//   return `${formattedStr(imgName)}${path.extname(src)}`;
// };
// const getImgName = (url, src) => `${getDirName(url)}/${formattedPath(url).host}${formattedImgName(src)}`;

// --
// path.parse {
//   root: '/',
//   dir: '/assets/professions',
//   base: 'nodejs.png',
//   ext: '.png',
//   name: 'nodejs'
// }
// path.extname .png
// formattedPath  ru-hexlet-io-courses
// html-file name:  ru-hexlet-io-courses.html
// resourse dir:  ru-hexlet-io-courses_files
// imgName:  /assets/professions/nodejs
// new imageName:  -assets-professions-nodejs.png
// imgName:  /assets/professions/nodejs
// gener imgName:  ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png

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

// Функция для проверки, является ли URL локальным (тот же домен)
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

// Функция для скачивания изображения
const downloadImage = (imageUrl, imagePath) => {
  return axios.get(imageUrl, { responseType: 'arraybuffer' })
    .then(response => fs.writeFile(imagePath, response.data))
    .then(() => ({
      originalUrl: imageUrl,
      localPath: imagePath,
      status: 'success',
    }))
    .catch(error => ({
      originalUrl: imageUrl,
      error: error.message,
      status: 'failed',
    }))
}

function pageloader(url, dir = process.cwd()) {
  log('=== Starting pageloader ===')
  log('URL: %s', url)
  log('Output directory: %s', dir)
  
  let htmlData
  let $
  let dirPath

  return getHtmlPage(url, dir)
    .then((result) => {
      htmlData = result
      const dirName = getDirName(url)
      dirPath = path.join(dir, dirName)
      return fs.mkdir(dirPath, { recursive: true })
    })
    .then(() => {

      $ = cheerio.load(htmlData.htmlContent)

      const localImages = []
      $('img').each((i, element) => {
        const src = $(element).attr('src')
        if (src && isLocalResource(url, src)) {
          const fullImageUrl = new URL(src, url).href
          const imageName = getImgName(url, src)
          const imagePath = path.join(dir, imageName)

          localImages.push({
            element,
            originalSrc: src,
            fullUrl: fullImageUrl,
            localPath: imagePath,
            relativePath: imageName,
          })
        }
      })

      const downloadPromises = localImages.map(img =>
        downloadImage(img.fullUrl, img.localPath),
      )

      return Promise.all(downloadPromises)
        .then(downloadResults => ({ localImages, downloadResults }))
    })
    .then(({ localImages, downloadResults }) => {

      localImages.forEach((img, index) => {
        const downloadResult = downloadResults[index]
        if (downloadResult.status === 'success') {
          $(img.element).attr('src', img.relativePath)
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
