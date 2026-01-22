import path from 'path'

const formattedStr = str => str
  .replace(/[^a-zA-Z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '')

const formattedPath = (url) => {
  const { hostname, pathname } = new URL(url)
  const newPath = formattedStr(`${hostname}${pathname}`)
  const host = formattedStr(hostname)
  const result = { newPath, host }
  return result
}

const getHtmlFileName = url => `${formattedPath(url).newPath}.html`

const getDirName = url => `${formattedPath(url).newPath}_files`

const formattedName = (imgUrl) => {
  const { hostname, pathname } = new URL(imgUrl)
  const ext = path.extname(pathname)
  const pathWithoutExt = pathname.slice(0, -ext.length)
  const formattedName = formattedStr(`${hostname}${pathWithoutExt}`)
  return `${formattedName}${ext}`
}

const getAssetPath = (pageUrl, src) => {
  const fullAssetUrl = new URL(src, pageUrl)
  return `${getDirName(pageUrl)}/${formattedName(fullAssetUrl.href)}`
}

export { getHtmlFileName, getDirName, getAssetPath }
