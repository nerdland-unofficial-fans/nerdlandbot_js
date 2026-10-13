const { PermissionsBitField } = require('discord.js')
const { getDeleteHistoryHours, getGuild } = require('../helpers/guildData')
const log = require('../helpers/logger')
const { logAdminEvent } = require('../helpers/adminLog')

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

  const fields = [
    { name: 'Gebruiker', value: `<@${member.id}> (${member.user?.tag ?? member.id}, ID: ${member.id})` },
    { name: 'Kanaal', value: `<#${message.channelId}>` }
  ]

  if (!member.bannable) {
    log.warn(`Could not ban member ${member.id} after posting in ban trap channel ${message.channelId}`)
    await logAdminEvent(message.guild, {
      title: 'Banval: ban mislukt',
      description: 'Het lid kon niet gebannen worden (onvoldoende rechten of hogere rol).',
      level: 'warning',
      fields
    })
    return
  }

  const deleteHistoryHours = getDeleteHistoryHours(guildData)

  await member.ban({
    deleteMessageSeconds: deleteHistoryHours * 60 * 60,
    reason: `Posted in configured ban trap channel ${message.channelId}`
  })

  log.info(`Banned member ${member.id} after posting in ban trap channel ${message.channelId}`)
  await logAdminEvent(message.guild, {
    title: 'Banval: lid gebannen',
    level: 'danger',
    fields: [...fields, { name: 'Berichtgeschiedenis verwijderd', value: `${deleteHistoryHours} uur` }]
  })
}

module.exports = { isExempt, isModerator, onBanTrapMessageAsync }
