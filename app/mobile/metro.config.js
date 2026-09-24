// Web と共通のコード（app/web/src/shared）をバンドルに含めるための設定。
// import は tsconfig.json の paths（@shared/*）で解決される。
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const sharedRoot = path.resolve(projectRoot, '../web/src/shared')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [...(config.watchFolders ?? []), sharedRoot]
// 共通コードは npm パッケージを import しない決まりだが、万一読んでも app/web/node_modules ではなく
// こちらの node_modules で解決させ、React などが二重に読み込まれないようにする。
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')]

module.exports = config
