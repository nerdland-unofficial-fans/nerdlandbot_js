// imports
const fs = require('fs')
const path = require('path')
const { readJson, writeJson } = require('./jsonStore')
const constants = require('./constants')

// constants
const configFolder = constants.GUILD_DATA
const configCache = {}

// create configs folder if it does not exist
if (!fs.existsSync(configFolder)) { fs.mkdirSync(configFolder) }

// get path to config file for given guildID
function getConfigFilePath (guildId) {
  return path.join(configFolder, guildId.toString() + '.json')
}

async function getGuild (guildId) {
  if (guildId in configCache) { return configCache[guildId] }

  const filepath = getConfigFilePath(guildId)

  let config = {}
  if (fs.existsSync(filepath)) { config = await parseFile(filepath) } else { config = createGuild(guildId) }

  configCache[guildId] = config
  return config
}

async function saveGuild (guild) {
  await writeJson(guild, getConfigFilePath(guild.guildId))
}

function createGuild (guildId) {
  const guild = new GuildData(guildId)
  initGuild(guild)
  return guild
}

async function parseFile (filepath) {
  const guild = await readJson(filepath)
  initGuild(guild)
  return guild
}

function initGuild (guild) {
  // initialize all guild properties here in case we use an old save that does not have them yet!
}

class GuildData {
  constructor (guildId) {
    this.guildId = guildId
  }
}

module.exports = {
  getGuild,
  saveGuild,
  getAllGuilds: async function () {
    const guilds = []

    const files = fs.readdirSync(configFolder)

    files.forEach(async function (file) {
      const split = file.split('.')
      if (split[1] === 'json') {
        const guild = await getGuild(parseInt(split[0]))
        guilds.push(guild)
      }
    })
    return guilds
  }
}
