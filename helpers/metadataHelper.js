const fs = require('fs')
const log = require('../helpers/logger')

async function getAllCommands (excludedFiles) {
  try {
    return (await fs.promises.readdir('./commands'))
      .filter(file => file.endsWith('.js') && (excludedFiles === undefined || !excludedFiles.includes(file)))
      .map(file => require(`../commands/${file}`))
  } catch (err) { log.error(err) }
}

function getAllCommandsSync (excludedFiles) {
  try {
    return fs.readdirSync('./commands')
      .filter(file => file.endsWith('.js') && (excludedFiles === undefined || !excludedFiles.includes(file)))
      .map(file => require(`../commands/${file}`))
  } catch (err) {
    log.error(err)
  }
}

module.exports = { getAllCommands, getAllCommandsSync }
