const { EmbedBuilder } = require('discord.js')
const { getGuild } = require('./guildData')
const log = require('./logger')

const COLORS = {
  info: 0x3498db,
  warning: 0xf1c40f,
  danger: 0xe74c3c
}

// Posts an audit entry in the configured admin log channel. Never throws:
// a missing or broken log channel must not break the action being logged.
async function logAdminEvent (guild, { title, description, level = 'info', fields = [] }) {
  try {
    const guildData = await getGuild(guild.id)
    if (!guildData.adminLogChannelId) { return }

    const channel = guild.channels.cache.get(guildData.adminLogChannelId) ??
      await guild.channels.fetch(guildData.adminLogChannelId)
    if (!channel?.isTextBased()) { return }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(COLORS[level] ?? COLORS.info)
      .setTimestamp()
    if (description) { embed.setDescription(description) }
    if (fields.length > 0) { embed.addFields(fields) }

    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } })
  } catch (error) {
    log.warn(`Could not write admin log entry "${title}" in guild ${guild.id}: ${error}`)
  }
}

module.exports = { logAdminEvent }
