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
const testFilePath = getFixturePath('file1.html')
const testImgPath = getFixturePath('file2.html')
const testUrl = 'https://ru.hexlet.io/courses'

let pathToTmpDir
let expectedHtmlPath
let expectedDirPath
let expectedImgPath

beforeEach(async () => {
  logTest('Setting up test environment')

  pathToTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
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
// // Добавьте в тесты проверку скачивания ресурсов и изменения HTML.

test('should be read file on the given path', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, testFilePath)

  const filepath = await pageLoader(testUrl, pathToTmpDir)
  const contents = await fs.readFile(filepath, { encoding: 'utf8' })
  const expectedData = await fs.readFile(testFilePath, { encoding: 'utf8' })
  expect(contents).toBe(expectedData)
})

// -
test('should return right path to file with img, save img', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, testImgPath)
    .get('/assets/professions/nodejs.png')
    .reply(200, imageContent)

  await pageLoader(testUrl, pathToTmpDir)
  expect(fs.access(expectedImgPath)).resolves.not.toThrow()

  const imageContent = Buffer.from('fake image content')
  const savedImageContent = await fs.readFile(expectedImgPath)

  // проверить пути
  expect(savedImageContent.equals(imageContent)).toBe(true)
  const savedHtml = await fs.readFile(expectedHtmlPath, 'utf-8')
  expect(savedHtml).toContain('src="ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png"')
})
