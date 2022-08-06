// imports
const fs = require('fs').promises
const path = require('path')
const { readJson, writeJson } = require('./jsonStore')
const constants = require('./constants')
const { PermissionsBitField } = require('discord.js')
const { reply } = require('./interactionHelper')
const { removeElementFromArray } = require('./arrayHelper')

// constants
const configFolder = constants.GUILD_DATA
const configCache = {}

// create configs folder if it does not exist
;(async function () {
  await fs.mkdir(configFolder).catch(err => {
    if (err.code !== 'EEXIST') {
      throw err
    }
  })
})()

// get path to config file for given guildID
function getConfigFilePath (guildId) {
  return path.join(configFolder, guildId.toString() + '.json')
}

async function getGuild (guildId) {
  if (configCache[guildId]) { return configCache[guildId] }

  const filepath = getConfigFilePath(guildId)

  let guildData
  try {
    guildData = await parseGuildFile(filepath)
  } catch (err) {
    // ENOENT = file does not exist
    if (err.code !== 'ENOENT') {
      throw err
    }
    guildData = createGuild(guildId)
  }

  configCache[guildId] = guildData
  return guildData
}

async function saveGuild (guildData) {
  await writeJson(guildData, getConfigFilePath(guildData.guildId))
}

function createGuild (guildId) {
  const guildData = { guildId }
  initGuild(guildData)
  return guildData
}

async function parseGuildFile (filepath) {
  const guildData = await readJson(filepath)
  initGuild(guildData)
  return guildData
}

function initGuild (guild) {
  // initialize all guild properties here in case we use an old save that does not have them yet!
  if (!guild.admins) { guild.admins = [] }
  if (!guild.notifyLists) { guild.notifyLists = {} }
  if (!guild.purgers) { guild.purgers = {} }
  if (!guild.memberNotificationNumber) { guild.memberNotificationNumber = constants.DEFAULT_MEMBER_NOTIFICATION_NUMBER }
  if (!guild.memberNotificationChannelId) { guild.memberNotificationChannelId = '' }
  if (!guild.moderatorAlertChannelId) { guild.moderatorAlertChannelId = '' }
}

async function getAllGuilds () {
  const guilds = []

  const files = await fs.readdir(configFolder)

  for (const file of files) {
    const split = file.split('.')
    if (split[1] === 'json') {
      const guild = await getGuild(split[0])
      guilds.push(guild)
    }
  }
  return guilds
}

async function verifyAdmin (interaction) {
  const user = interaction.member
  const guild = await getGuild(interaction.guildId)

  const isGuildAdmin = user.permissions.has(PermissionsBitField.Flags.Administrator)
  const isBotAdmin = guild.admins.includes(user.id)

  if (!isGuildAdmin && !isBotAdmin) {
    await reply(interaction, 'https://gph.is/g/4w8PDNj')
    return false
  }
  return true
}

async function AddAdminToGuild (guild, userId) {
  guild.admins.push(userId)
  await saveGuild(guild)
}

async function removeAdminFromGuild (guild, userId) {
  removeElementFromArray(guild.admins, userId)
  await saveGuild(guild)
}

module.exports = {
  getGuild,
  saveGuild,
  verifyAdmin,
  AddAdminToGuild,
  removeAdminFromGuild,
  getAllGuilds
}
