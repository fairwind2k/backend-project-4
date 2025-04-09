import downloadPage from './loader.js';

const pageloader = (url, dir) => {
  return downloadPage(url, dir)
    .then(dirName => {
      // console.log('dirName=', dirName);
      return dirName;
    });
};

export default pageloader;
