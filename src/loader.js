import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import generateFileName from './utils/file-name.js';

function downloadPage(url, dir = process.cwd()) {
  return axios.get(url)
    .then((response) => {
      const fileName = generateFileName(url);
      const filePath = path.join(dir, fileName);
      return fs.writeFile(filePath, response.data)
        .then(() => filePath);
    })
    .catch((error) => {
      console.error('Ошибка загрузки страницы:', error.message);
      throw error;
    });
}

export default downloadPage;
