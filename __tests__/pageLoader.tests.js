import { test, expect, beforeEach, afterEach, afterAll } from '@jest/globals'
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

  nock.cleanAll()

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
  nock.cleanAll()
  try {
    if (pathToTmpDir) {
      await fs.access(pathToTmpDir)
      await fs.rm(pathToTmpDir, { recursive: true, force: true })
      logTest('Removed temp dir: %s', pathToTmpDir)
    }
  }
  catch (error) {
    console.log(error)
  }
})

afterAll(async () => {
  nock.cleanAll()
  nock.restore()
})

test('should return right path to file', async () => {
  logTest('Test: should return right path to file')

  logNock('Creating mock: GET https://ru.hexlet.io/courses')
  // nock('https://ru.hexlet.io')
  const scope = nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '')
  logTest('Calling pageloader...')

  const actual = await pageLoader(testUrl, pathToTmpDir)
  logTest('Returned path: %s', actual)
  logTest('Expected path: %s', expectedHtmlPath)

  expect(actual.htmlFilePath).toBe(expectedHtmlPath)
  expect(scope.isDone()).toBe(true)
  logTest('Test passed')
})

test('should be read file on the given path', async () => {
  // nock('https://ru.hexlet.io')
  const scope = nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, testFilePath)

  const filepath = await pageLoader(testUrl, pathToTmpDir)
  const contents = await fs.readFile(filepath.htmlFilePath, { encoding: 'utf8' })
  const expectedData = await fs.readFile(testFilePath, { encoding: 'utf8' })

  logTest('Returned path: %s', contents)
  logTest('Expected path: %s', expectedData)
  expect(contents).toBe(expectedData)
  expect(scope.isDone()).toBe(true)
})

test('DEBUG: check what is created', async () => {
  const imageContent = Buffer.from('fake image content')

  const scope = nock('https://ru.hexlet.io')
  // nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, testImgPath)
    .get('/assets/professions/nodejs.png')
    .reply(200, imageContent)

  await pageLoader(testUrl, pathToTmpDir)

  // вывод ВСЁ что создалось
  const allFiles = await fs.readdir(pathToTmpDir, { recursive: true })
  console.log('ALL FILES CREATED:', allFiles)
  console.log('EXPECTED PATH:', expectedImgPath)

  expect(scope.isDone()).toBe(true)
})

test('should return right path to file with img, save img', async () => {
  const htmlContent = await fs.readFile(testImgPath, 'utf-8') // testImgPath = getFixturePath('with-media.html')
  console.log('HTML from fixture:', htmlContent)

  expect(htmlContent).toContain('/assets/professions/nodejs.png')

  const imageContent = Buffer.from('fake image content')
  const scope = nock('https://ru.hexlet.io')
  // nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, testImgPath)
    .get('/assets/professions/nodejs.png')
    .reply(200, imageContent)

  await pageLoader(testUrl, pathToTmpDir)
  // Debug:
  // console.log('Expected HTML path:', expectedHtmlPath)
  // console.log('Expected IMG path:', expectedImgPath)

  //  const files = await fs.readdir(pathToTmpDir)
  //  console.log('Files in temp dir:', files)

  //   const filesDir = path.join(pathToTmpDir, 'ru-hexlet-io-courses_files')
  //    try {
  //   const resourceFiles = await fs.readdir(filesDir)
  //   console.log('Files in _files dir:', resourceFiles)

  //   for (const file of resourceFiles) {
  //     const stats = await fs.stat(path.join(filesDir, file));
  //     console.log(`- ${file}: ${stats.size} bytes`);
  //   }
  //   } catch (err) {
  //     console.log('_files directory does not exist!')
  //   }
  //   const savedHtml1 = await fs.readFile(expectedHtmlPath, 'utf-8');
  //   console.log('\n=== Saved HTML ===');
  //   console.log(savedHtml1);
  //   console.log('\n=== Image src in HTML ===');
  //   const imgSrcMatch = savedHtml1.match(/<img[^>]+src="([^"]+)"/);
  //   console.log('Found img src:', imgSrcMatch ? imgSrcMatch[1] : 'NOT FOUND');

  // expect(nock.isDone()).toBe(true)
  expect(scope.isDone()).toBe(true)

  await fs.access(expectedImgPath)

  const savedImageContent = await fs.readFile(expectedImgPath)
  expect(savedImageContent.equals(imageContent)).toBe(true)

  const savedHtml = await fs.readFile(expectedHtmlPath, 'utf-8')
  expect(savedHtml).toContain(
    'src="ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png"',
  )
})
// negative cases:

test('should throw error when URL returns 404', async () => {
  logTest('Test: should throw error on 404')

  const scope = nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(404, 'Not Found')

  await expect(async () => {
    await pageLoader(testUrl, pathToTmpDir)
  }).rejects.toThrow()

  expect(scope.isDone()).toBe(true)
  logTest('Test passed: 404 error thrown')
})

test('should throw error when URL returns 500', async () => {
  logTest('Test: should throw error on 500')

  const scope = nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(500, 'Internal Server Error')

  await expect(async () => {
    await pageLoader(testUrl, pathToTmpDir)
  }).rejects.toThrow()

  expect(scope.isDone()).toBe(true)
  logTest('Test passed: 500 error thrown')
})

test('should throw error on network failure', async () => {
  logTest('Test: should throw error on network failure')

  const scope = nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithError('Network error occurred')

  await expect(async () => {
    await pageLoader(testUrl, pathToTmpDir)
  }).rejects.toThrow()

  expect(scope.isDone()).toBe(true)
  logTest('Test passed: network error thrown')
})

test('should throw error when output directory does not exist', async () => {
  logTest('Test: should throw error when directory does not exist')

  const nonExistentDir = path.join(pathToTmpDir, 'non-existent-dir', 'nested')

  await expect(async () => {
    await pageLoader(testUrl, nonExistentDir)
  }).rejects.toThrow()

  logTest('Test passed: non-existent directory error thrown')
})

test('should throw error on invalid URL', async () => {
  logTest('Test: should throw error on invalid URL')

  await expect(async () => {
    await pageLoader('not-a-valid-url', pathToTmpDir)
  }).rejects.toThrow
  logTest('Test passed: invalid URL error thrown')
})

test('should throw error when resource download fails', async () => {
  logTest('Test: should throw error when resource download fails')

  const scope = nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, testImgPath)
    .get('/assets/professions/nodejs.png')
    .reply(404, 'Image not found')

  await expect(async () => {
    await pageLoader(testUrl, pathToTmpDir)
  }).rejects.toThrow()

  expect(scope.isDone()).toBe(true)
  logTest('Test passed: resource download error thrown')
})
