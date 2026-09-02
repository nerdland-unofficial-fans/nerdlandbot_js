const { PermissionsBitField } = require('discord.js')
const { getDeleteHistoryHours, getGuild } = require('../helpers/guildData')
const log = require('../helpers/logger')

const MODERATOR_PERMISSIONS = [
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ManageMessages,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.ModerateMembers
]

function isModerator (member) {
  return MODERATOR_PERMISSIONS.some(permission => member.permissions.has(permission))
}

function isExempt (member, guildData) {
  return isModerator(member) || guildData.admins.includes(member.id)
}

async function onBanTrapMessageAsync (message) {
  if (!message.inGuild() || message.author.bot) {
    return
  }

  const guildData = await getGuild(message.guildId)
  if (!guildData.banTrap || guildData.banTrap.channelId !== message.channelId) {
    return
  }

  const member = message.member ?? await message.guild.members.fetch(message.author.id)
  if (isExempt(member, guildData)) {
    return
  }

  try {
    await message.delete()
  } catch (error) {
    log.warn(`Could not delete ban trap message ${message.id}: ${error}`)
  }

  if (!member.bannable) {
    log.warn(`Could not ban member ${member.id} after posting in ban trap channel ${message.channelId}`)
    return
  }

  const deleteHistoryHours = getDeleteHistoryHours(guildData)

  await member.ban({
    deleteMessageSeconds: deleteHistoryHours * 60 * 60,
    reason: `Posted in configured ban trap channel ${message.channelId}`
  })

  log.info(`Banned member ${member.id} after posting in ban trap channel ${message.channelId}`)
}

module.exports = { isExempt, isModerator, onBanTrapMessageAsync }
