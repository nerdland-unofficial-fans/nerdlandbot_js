const fs = require('fs').promises
const log = require('./logger')

module.exports = {
  readJson: async function (filepath) {
    try {
      const json = await fs.readFile(filepath)
      return JSON.parse(json)
    } catch (err) {
      log.error(err)
      throw err
    }
  },

  writeJson: async function (data, filepath) {
    try {
      const json = JSON.stringify(data)
      await fs.writeFile(filepath, json)
      log.info('JSON data saved to file')
    } catch (err) {
      if (err) {
        log.error(err)
        throw err
      }
    }
  }
}
