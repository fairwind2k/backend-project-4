import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { generateHtmlFileName } from './utils/file-name.js';

function downloadHtmlPage(url, dir = process.cwd()) {
  return axios.get(url)
    .then((response) => {
      const fileName = generateHtmlFileName(url);
      const filePath = path.join(dir, fileName);
      return fs.writeFile(filePath, response.data)
        .then(() => filePath);
    })
    .then( )
    .catch((error) => {
      console.error('Ошибка загрузки страницы:', error.message);
      throw error;
    });
}

function downloadResource(resourceUrl, outputDir) {
  const fileName = generateFileName(resourceUrl);
  const filePath = path.join(outputDir, fileName);

  return axios.get(resourceUrl, { responseType: 'arraybuffer' })
    .then(response => fs.writeFile(filePath, response.data))
    .then(() => ({
      originalUrl: resourceUrl,
      localPath: path.relative(outputDir, filePath),
      status: 'success'
    }))
    .catch(error => ({
      originalUrl: resourceUrl,
      error: error.message,
      status: 'failed'
    }));
}


function downloadPage(url, dir = process.cwd()) {
  const htmlFileName = generateFileName(url);
  const htmlFilePath = path.join(dir, htmlFileName);
  const resourcesDir = getResourcesDir(htmlFilePath);
  let $;

  return axios.get(url)
    .then(response => {
      $ = cheerio.load(response.data);
      return fs.mkdir(resourcesDir, { recursive: true });
    })
    .then(() => {
      const resources = [];
      $('img, link[rel="stylesheet"], script').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('href');
        if (src && !src.startsWith('data:')) {
          resources.push(new URL(src, url).href);
        }
      });
      return Promise.all(resources.map(resourceUrl => downloadResource(resourceUrl, resourcesDir)));
    })
    .then(downloadResults => {
      $('img, link[rel="stylesheet"], script').each((i, el) => {
        const tag = $(el);
        const attr = tag.is('img') || tag.is('script') ? 'src' : 'href';
        const originalUrl = tag.attr(attr);
        
        if (originalUrl && !originalUrl.startsWith('data:')) {
          const resourceUrl = new URL(originalUrl, url).href;
          const foundResource = downloadResults.find(r => r.originalUrl === resourceUrl);
          
          if (foundResource && foundResource.status === 'success') {
            tag.attr(attr, path.join(path.basename(resourcesDir), foundResource.localPath));
          }
        }
      });
      return fs.writeFile(htmlFilePath, $.html());
    })
    .then(() => ({
      htmlPath: htmlFilePath,
      resourcesDir,
      downloadedResources: downloadResults
    }))
    .catch(error => {
      console.error('Download failed:', error.message);
      throw error;
    });
}

export default downloadPage;
