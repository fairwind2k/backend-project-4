import path from path;

const formattedStr = (str) => str.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');

const formattedPath = (url) => {
  const { hostname, pathname } = new URL(url);
  const newPath = formattedStr(`${hostname}${pathname}`);
  const host = formattedStr(hostname);
  const result = { newPath, host };
  return result;
};

const generateHtmlFileName = (url) => `${formattedPath(url).newPath}.html`;

const generateDirName = (url) => `${formattedPath(url).newPath}_files`;

const formattedImgName = (src) => {
  const imgName = `${path.parse(src).dir}/${path.parse(src).name}`;
  return `${formattedStr(imgName)}${path.extname(src)}`;
};
const generateImgName = (url, src) => `${generateDirName(url)}/${formattedPath(url).host}${formattedImgName(src)}`;

export { generateHtmlFileName, generateDirName, generateImgName };
