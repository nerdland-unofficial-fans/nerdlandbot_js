const { getGuild } = require('../helpers/guildData')
const log = require('../helpers/logger')

async function onMemberJoinAsync (member, client) {
  const memberCount = (await member.guild.members.fetch()).filter(member => !member.user.bot).size
  const guildData = await getGuild(member.guild.id)
  if (!guildData.memberNotificationChannelId) {
    return
  }
  if (memberCount % guildData.memberNotificationNumber === 0) {
    const notificationChannel = client.channels.cache?.find(channel => channel.id === guildData.memberNotificationChannelId)
    if (!notificationChannel) {
      log.error(`notification channel ${guildData.memberNotificationChannelId} not found on guild ${member.guild.id}`)
      return
    }
    notificationChannel.send(`${member.guild.name} heeft nu ${memberCount} leden! Proficiat!`)
  }
}

module.exports = { onMemberJoinAsync }
