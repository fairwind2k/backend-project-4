import path from 'path'
import { downloadResource } from '../modules/resource-loader.js'

const createDownloadTasks = (localResources, results) => {
  return localResources.map((resource, index) => ({
    title: `${path.basename(resource.localPath)}`,
    task: () => downloadResource(resource.fullUrl, resource.localPath)
      .then((result) => { results[index] = result }),
  }))
}

export { createDownloadTasks }
