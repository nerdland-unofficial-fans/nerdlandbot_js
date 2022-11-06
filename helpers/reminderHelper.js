const { getGuild, saveGuild } = require('./guildData')
const { discordTime } = require('./DateTimeHelper')
// const { reply } = require('./interactionHelper')

async function setReminder (interaction) {
  const guild = await getGuild(interaction.guildId)
  const currentTime = discordTime().toEpochSecond().toString()
  const timeToBeReminded = discordTime().plusMinutes(interaction.fields.getTextInputValue('reminderTime')).toEpochSecond()
  const message = interaction.fields.getTextInputValue('reminderMessage')
  const memberId = interaction.member.id
  guild.reminders[currentTime] = { memberId, timeToBeReminded, message }
  await saveGuild(guild)
  await interaction.reply({ content: '.' })
}

module.exports = {
  setReminder
}
