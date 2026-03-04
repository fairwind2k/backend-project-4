import path from 'path'
import { downloadResource } from '../modules/resource-loader'

const createDownloadTasks = (localResources) => {
  return localResources.map((resource) => ({
    title: `${path.basename(resource.localPath)}`,
    task: () => downloadResource(resource.fullUrl, resource.localPath),
  }))
}

export { createDownloadTasks }