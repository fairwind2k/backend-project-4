import downloadPage from './loader.js';

const pageloader = (url, dir) => downloadPage(url, dir)
    .then(dirName => dirName);

export default pageloader;
