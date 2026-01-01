import { test, expect, beforeEach, afterEach } from '@jest/globals'
import path, { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import os from 'os'
import nock from 'nock'
import { logTest, logNock } from '../src/logger.js'
import pageLoader from '../src/index.js'

nock.disableNetConnect()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getFixturePath = filename => join(__dirname, '../__fixtures__', filename)
const testFilePath = getFixturePath('minimal.html')
const testImgPath = getFixturePath('with-media.html')

const testUrl = 'https://ru.hexlet.io/courses'

let pathToTmpDir
let expectedHtmlPath
let expectedDirPath
let expectedImgPath

beforeEach(async () => {
  logTest('Setting up test environment')

  pathToTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-')) // проверить что создается папка page-loader
  logTest('Created temp dir: %s', pathToTmpDir)

  expectedHtmlPath = `${pathToTmpDir}/ru-hexlet-io-courses.html`
  expectedDirPath = path.join(pathToTmpDir, 'ru-hexlet-io-courses_files')
  expectedImgPath = path.join(
    expectedDirPath,
    'ru-hexlet-io-assets-professions-nodejs.png',
  )
  logTest('Expected HTML path: %s', expectedHtmlPath)
  logTest('Expected dir path: %s', expectedDirPath)
})

afterEach(async () => {
  logTest('Cleaning up test environment')
  await fs.rm(pathToTmpDir, { recursive: true, force: true })
  logTest('Removed temp dir: %s', pathToTmpDir)
})

// afterEach(() => {
//   fs.rmSync(tempDir, { recursive: true, force: true })
// })

test('should return right path to file', async () => {
  logTest('Test: should return right path to file')

  logNock('Creating mock: GET https://ru.hexlet.io/courses')
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '')
  logTest('Calling pageloader...')
  const actual = await pageLoader(testUrl, pathToTmpDir)
  logTest('Returned path: %s', actual)
  logTest('Expected path: %s', expectedHtmlPath)

  expect(actual.htmlFilePath).toBe(expectedHtmlPath)
  logTest('Test passed')
})
// // Добавить в тесты проверку скачивания ресурсов и изменения HTML.
// добавить проверку ошибок

test('should be read file on the given path', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, testFilePath)

  const filepath = await pageLoader(testUrl, pathToTmpDir)
  const contents = await fs.readFile(filepath.htmlFilePath, { encoding: 'utf8' })
  const expectedData = await fs.readFile(testFilePath, { encoding: 'utf8' })

  logTest('Returned path: %s', contents)
  logTest('Expected path: %s', expectedData)
  expect(contents).toBe(expectedData)
})


test('DEBUG: check what is created', async () => {
  const imageContent = Buffer.from('fake image content')
  
  nock('https://ru.hexlet.io')  
    .get('/courses')  
    .replyWithFile(200, testImgPath)  
    .get('/assets/professions/nodejs.png')  
    .reply(200, imageContent)
  
  await pageLoader(testUrl, pathToTmpDir)
  
  // вывод ВСЁ что создалось
  const allFiles = await fs.readdir(pathToTmpDir, { recursive: true })
  console.log('ALL FILES CREATED:', allFiles)
  console.log('EXPECTED PATH:', expectedImgPath)
})

// - падает строка 119
//   expect(received).toBe(expected) // Object.is equality
  //   Expected: true
  //  Received: false
test('should return right path to file with img, save img', async () => {
  const htmlContent = await fs.readFile(testImgPath, 'utf-8')
  console.log('HTML from fixture:', htmlContent)

  expect(htmlContent).toContain('/assets/professions/nodejs.png')

  const imageContent = Buffer.from('fake image content')
  nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, testImgPath)
    .get('/assets/professions/nodejs.png')
    .reply(200, imageContent)

  expect(nock.isDone()).toBe(true)
  
  await expect(fs.access(expectedImgPath))
  
  const savedImageContent = await fs.readFile(expectedImgPath)  
  expect(savedImageContent.equals(imageContent)).toBe(true)  
  
  const savedHtml = await fs.readFile(expectedHtmlPath, 'utf-8')  
  expect(savedHtml).toContain(
    'src="ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png"'
  ) 

  // console.log
  //   ALL FILES CREATED: [
  //     'ru-hexlet-io-courses.html',
  //     'ru-hexlet-io-courses_files',
  //     'ru-hexlet-io-courses_files/ru-hexlet-io-nodejs.png'
  //   ]

  //     at Object.log (__tests__/pageLoader.tests.js:98:11)

  // console.log
  //   EXPECTED PATH: /var/folders/np/86x2pz2n7q56rpgf2zf3zw_w0000gn/T/page-loader-PhHMNH/ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png

  //     at Object.log (__tests__/pageLoader.tests.js:99:11)

  // console.log
  //   HTML from fixture: <!DOCTYPE html><html lang="ru"><head>
  //       <meta charset="utf-8">
  //       <title>Курсы по программированию Хекслет</title>
  //     </head>
  //     <body>
  //       <img src="/assets/professions/nodejs.png" alt="Иконка профессии Node.js-программист" />
  //       <h3>
  //         <a href="/professions/nodejs">Node.js-программист</a>
  //       </h3>
  //     </body>
  //   </html>

  // await pageLoader(testUrl, pathToTmpDir)
  // await expect(fs.access(expectedImgPath)).resolves.toBeUndefined()
  // // expect(fs.access(expectedImgPath)).resolves.not.toThrow()

  // const savedImageContent = await fs.readFile(expectedImgPath)

  // // проверить пути
  // expect(savedImageContent.equals(imageContent)).toBe(true)
  // const savedHtml = await fs.readFile(expectedHtmlPath, 'utf-8')
  // expect(savedHtml).toContain('src="ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png"')
})
