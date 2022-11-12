const { getGuild, saveGuild } = require('./guildData')
const { discordTime } = require('./DateTimeHelper')

async function setReminder (interaction) {
  const guild = await getGuild(interaction.guildId)
  const currentTime = discordTime().toEpochSecond().toString()
  const reminderMinutes = interaction.fields.getTextInputValue('reminderTime')
  const timeToBeReminded = discordTime().plusMinutes(interaction.fields.getTextInputValue('reminderTime')).toEpochSecond()
  const message = interaction.fields.getTextInputValue('reminderMessage')
  const memberId = interaction.member.id
  guild.reminders[currentTime] = { memberId, timeToBeReminded, message }
  await saveGuild(guild)
  if (reminderMinutes === '1') {
    await interaction.reply({ content: `Reminder ingesteld voor binnen ${reminderMinutes} minuut!` })
  } else {
    await interaction.reply({ content: `Reminder ingesteld voor binnen ${reminderMinutes} minuten!` })
  }
}

module.exports = {
  setReminder
}
