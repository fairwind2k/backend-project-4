import path from 'path'
import { getHtmlFileName, getAssetPath } from './file-name.js'
import { isLocalResource } from './validators.js'

const prepareFileData = (response, url, dir) => {
  const fileName = getHtmlFileName(url)
  const filePath = path.join(dir, fileName)
  return {
    filePath,
    htmlContent: response.data,
    data: response.data,
  }
}

const findLocalResources = (url, $, dir) => {
  const localResources = []

  const resourceSelectors = [
    { selector: 'img', attr: 'src' },
    { selector: 'link', attr: 'href' },
    { selector: 'script', attr: 'src' },
  ]

  resourceSelectors.forEach(({ selector, attr }) => {
    $(selector).each((i, element) => {
      const resourceSrc = $(element).attr(attr)
      if (resourceSrc && isLocalResource(url, resourceSrc)) {
        const fullResourceUrl = new URL(resourceSrc, url).href
        const resourceName = getAssetPath(url, resourceSrc)
        const resourcePath = path.join(dir, resourceName)

        localResources.push({
          element,
          tagName: selector,
          attrName: attr,
          fullUrl: fullResourceUrl,
          localPath: resourcePath,
          relativePath: resourceName,
        })
      }
    })
  })

  return localResources
}

const updateHtmlWithLocalPaths = ($, localResources, downloadResults) => {
  let successCount = 0

  localResources.forEach((resource, index) => {
    const downloadResult = downloadResults[index]
    if (downloadResult && downloadResult.status === 'success') {
      $(resource.element).attr(resource.attrName, resource.relativePath)
      successCount++
    }
  })

  return {
    updatedHtml: $.html(),
    successCount,
  }
}

export {
  prepareFileData,
  findLocalResources,
  updateHtmlWithLocalPaths,
}
