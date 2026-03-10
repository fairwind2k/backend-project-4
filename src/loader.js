import axios from 'axios'
import axiosDebug from 'axios-debug-log'
import path from 'path'
import fs from 'fs/promises'
import * as cheerio from 'cheerio'
import { log } from './logger.js'
import Listr from 'listr'
// import { log, logParser, logFs, logError } from './logger.js'
import { isValidUrl } from './utils/validators.js'
import { getDirName } from './utils/file-name.js'
import { checkDirectory, validateDirectory } from './modules/directory-manger.js'
import { findLocalResources, updateHtmlWithLocalPaths } from './utils/parsers.js'
import { createDownloadTasks } from './utils/task-builder.js'

import getHtmlPage from './modules/html-loader.js'

axiosDebug(axios)

function pageloader(url, dir = process.cwd()) {
  log('=== Starting pageloader ===')
  log('Output directory: %s', dir)

  let htmlData
  let $
  let dirPath
  let localResources
  let downloadResults

  return Promise.resolve()
    .then(() => isValidUrl(url))
    .then(() => validateDirectory(dir))
    .then(() => getHtmlPage(url, dir))
    .then((result) => {
      htmlData = result
      const dirName = getDirName(url)
      dirPath = path.join(dir, dirName)
    })
    .then(() => checkDirectory(dirPath))
    .then(() => {
      $ = cheerio.load(htmlData.htmlContent)
      localResources = findLocalResources(url, $, dir)
    })
    .then(() => {
      if (localResources.length === 0) {
        log('No local resources found to download')
        return
      }
      downloadResults = []
      const tasks = createDownloadTasks(localResources, downloadResults)
      const listr = new Listr(tasks, { concurrent: true, exitOnError: false })
      return listr.run()
    })
    .then(() => {
      if (localResources.length > 0) {
        updateHtmlWithLocalPaths($, localResources, downloadResults)
      }
    })
    .then(() => fs.writeFile(htmlData.filePath, $.html()))
    .then(() => ({
      htmlFilePath: htmlData.filePath,
      dirName: path.basename(dirPath),
      dirPath,
    }))
}

export { pageloader }
