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
    const cmds = fs.readdirSync('./commands')
    const filtered = cmds.filter(file => file.endsWith('.js') && (excludedFiles === undefined || !excludedFiles.includes(file)))
    const mapped = filtered.map(file => require(`../commands/${file}`))
    return mapped
  } catch (err) {
    log.error(err)
    return []
  }
}

module.exports = { getAllCommands, getAllCommandsSync }
