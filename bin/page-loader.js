#!/usr/bin/env node

import { program } from 'commander'
import pageloader from '../src/index.js'

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .helpOption('-h --help', 'display help for command')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  // .option('-o, --output [dir]', 'output dir', '/home/user/current-dir')
  .arguments('<url>')
  .action((url) => {
    const options = program.opts()
    pageloader(url, options.output)
      .then((result) => {
        console.log(`Page was successfully downloaded into: ${result.htmlFilePath}`)
        return result
      })
      .then((result) => {
        console.log(`Resorse directory: '${result.dirName}'`)
        return result
      })
      .catch((error) => {
        console.error('Ошибка загрузки:', error.message)
        process.exit(1)
      })
  })

program.parse(process.argv)
