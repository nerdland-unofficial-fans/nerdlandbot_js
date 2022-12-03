const { getGuild, saveGuild } = require('./guildData')
const { discordTime } = require('./DateTimeHelper')
const { foemp } = require('./foemp')

async function setReminder (interaction) {
  const guild = await getGuild(interaction.guildId)
  const reminderMinutes = interaction.fields.getTextInputValue('reminderTime')
  if (isNaN(reminderMinutes)) {
    return await interaction.reply({ content: `Je hebt het aantal minuten ingesteld (${reminderMinutes}) in een formaat dat ik niet begrijp. Probeer een integer (bv. 10), ${foemp()}!`, ephemeral: true })
  }
  const reminderTimestamp = discordTime().plusMinutes(reminderMinutes).toEpochSecond()
  const message = interaction.fields.getTextInputValue('reminderMessage')
  const memberId = interaction.member.id
  guild.reminders[reminderTimestamp.toString()] = { memberId, message }
  await saveGuild(guild)
  if (reminderMinutes === '1') {
    await interaction.reply({ content: 'Reminder ingesteld voor binnen 1 minuut!' })
  } else {
    await interaction.reply({ content: `Reminder ingesteld voor binnen ${reminderMinutes} minuten!` })
  }
}

module.exports = {
  setReminder
}
