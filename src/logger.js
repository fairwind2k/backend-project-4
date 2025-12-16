import debug from 'debug'

export const log = debug('page-loader:main')
export const logHttp = debug('page-loader:http')
export const logParser = debug('page-loader:parser')
export const logFs = debug('page-loader:fs')
export const logDownload = debug('page-loader:download')
export const logError = debug('page-loader:error')

export const logAxios = {
  request: debug('page-loader:axios:request'),
  response: debug('page-loader:axios:response'),
  error: debug('page-loader:axios:error')
}
export const logNock = debug('page-loader:nock')

export const logTest = debug('page-loader:test')