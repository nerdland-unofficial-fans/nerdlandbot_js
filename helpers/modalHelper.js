const { setReminder } = require('./reminderHelper')

async function replyToModal (interaction) {
  if (interaction.fields.getTextInputValue('reminderTime')) {
    setReminder(interaction)
  }
}

module.exports = {
  replyToModal
}
