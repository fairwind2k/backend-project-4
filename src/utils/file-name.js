import path from 'path'

const formattedStr = str => str
  .replace(/[^a-zA-Z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/-+$/, '')

const formattedPath = (url) => {
  const { hostname, pathname } = new URL(url)
  const newPath = formattedStr(`${hostname}${pathname}`)
  const host = formattedStr(hostname)
  const result = { newPath, host }
  return result
}

const getHtmlFileName = url => `${formattedPath(url).newPath}.html`

const getDirName = url => `${formattedPath(url).newPath}_files`

const formattedImgName = (src) => {
  const imgName = `${path.parse(src).dir}/${path.parse(src).name}`
  return `${formattedStr(imgName)}${path.extname(src)}`
}
const getImgName = (url, src) => `${getDirName(url)}/${formattedPath(url).host}${formattedImgName(src)}`

export { getHtmlFileName, getDirName, getImgName }
