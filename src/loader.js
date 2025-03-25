import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import generateFileName from './utils/file-name';
 
function downloadPage(url, dir = process.cwd()) {
    return axios.get(url)  // 1. Отправляем GET-запрос
        .then(response => {
            const fileName = generateFileName(url); // 2. Формируем имя файла
            const filePath = path.join(dir, fileName); // 3. Создаём полный путь

            return fs.promises.writeFile(filePath, response.data) // 4. Сохраняем в файл
                .then(() => filePath); // 5. Возвращаем путь
        })
        .catch(error => {
            console.error('Ошибка загрузки страницы:', error.message);
            throw error;
        });
}

