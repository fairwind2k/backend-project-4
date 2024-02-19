/* eslint-disable no-tabs */
import { test, expect, beforeEach } from '@jest/globals';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import os from 'os';
import nock from 'nock';
import pageLoader from '../src/index.js';

nock.disableNetConnect();

let pathToTmpDir;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFixturePath = (filename) => join(__dirname, '../__fixtures__', filename);
const testFilePath = getFixturePath('file1.html');

beforeEach(async () => {
  pathToTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('should return right path to file', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, `${pathToTmpDir}ru-hexlet-io-courses.html`);

  const actual = await pageLoader('https://ru.hexlet.io/courses');
  const expected = `${pathToTmpDir}ru-hexlet-io-courses.html`;
  expect(actual).toBe(expected);
});

test('should be read file on the given path', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, `${pathToTmpDir}ru-hexlet-io-courses.html`);

  await pageLoader('https://ru.hexlet.io/courses');
  const filepath = `${pathToTmpDir}ru-hexlet-io-courses.html`;
  const expectedData = await fs.readFile(filepath, { encoding: 'utf8' });
  const contents = await fs.readFile(testFilePath, { encoding: 'utf8' });
  expect(expectedData).toBe(contents);
});
