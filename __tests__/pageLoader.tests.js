import { test, expect, beforeEach, afterEach } from '@jest/globals'
import path, { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import os from 'os'
import nock from 'nock'
import pageLoader from '../src/index.js'

nock.disableNetConnect()

let pathToTmpDir

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getFixturePath = filename => join(__dirname, '../__fixtures__', filename)
const testFilePath = getFixturePath('file1.html')
const testImgPath = getFixturePath('file2.html')
const testUrl = 'https://ru.hexlet.io/courses'
const expectedHtmlPath = `${pathToTmpDir}/ru-hexlet-io-courses.html`
const expectedDirPath = path.join(pathToTmpDir, 'ru-hexlet-io-courses_files')
const expectedImgPath = path.join(
  expectedDirPath,
  'ru-hexlet-io-assets-professions-nodejs.png',
)

beforeEach(async () => {
  pathToTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})

afterEach(async () => {
  await fs.rm(pathToTmpDir, { recursive: true, force: true })
})

// afterEach(() => {
//   fs.rmSync(tempDir, { recursive: true, force: true })
// })

test('should return right path to file', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, `${pathToTmpDir}/ru-hexlet-io-courses.html`)

  const actual = await pageLoader(testUrl, pathToTmpDir)
  expect(actual).toBe(expectedHtmlPath)
})

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
