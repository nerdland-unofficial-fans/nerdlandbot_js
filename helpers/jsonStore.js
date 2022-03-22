const fs = require('fs').promises
const log = require('./logger')

module.exports = {
  readJson: async function (filepath) {
    const json = await fs.readFile(filepath, 'utf8')
    return JSON.parse(json)
  },

  writeJson: async function (data, filepath) {
    const json = JSON.stringify(data)
    await fs.writeFile(filepath, json)
    log.info('JSON data saved to file')
  }
}
