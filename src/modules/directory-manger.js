import path from 'path'
import fs from 'fs/promises'
import { handleFileWriteError } from '../errors/handlers.js'

const checkDirectory = (dir) => {
  return fs.stat(dir)
    .then((stats) => {
      if (!stats.isDirectory()) {
        const error = new Error(`${dir} exists but is not a directory`)
        error.code = 'ENOTDIR'
        throw error
      }
      return dir
    })
    .catch((error) => {
      if (error.code === 'ENOENT') {
        return fs.mkdir(dir)
          .then(() => dir)
      }
      throw error
    })
    .catch((error) => {
      if (error.code === 'EACCES' || error.code === 'ENOENT') {
        const parentDir = path.dirname(dir)
        handleFileWriteError(error, dir, parentDir)
      }
      throw error
    })
}

const validateDirectory = (dir) => {
  return fs.stat(dir)
    .then((stats) => {
      if (!stats.isDirectory()) {
        const error = new Error(`${dir} exists but is not a directory`)
        error.code = 'ENOTDIR'
        throw error
      }
      return dir
    })
    .catch((error) => {
      if (error.code === 'EACCES' || error.code === 'ENOENT') {
        const parentDir = path.dirname(dir)
        handleFileWriteError(error, dir, parentDir)
      }
      throw error
    })
}

export { checkDirectory, validateDirectory }
