import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import generateFileName from './utils/file-name';
 
function downloadPage(url, dir = process.cwd()) {
    return axios.get(url)
        .then(response => {
            const fileName = generateFileName(url);
            const filePath = path.join(dir, fileName);

            return fs.promises.writeFile(filePath, response.data)
                .then(() => filePath);
        })
        .catch(error => {
            console.error('Ошибка загрузки страницы:', error.message);
            throw error;
        });
}

