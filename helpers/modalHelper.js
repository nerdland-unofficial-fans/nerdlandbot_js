const { setReminder } = require('./reminderHelper')
const { MODAL_IDS } = require('./constants')

async function modalHelper (interaction) {
  if (interaction.customId === MODAL_IDS.REMINDER_MODAL) {
    setReminder(interaction)
  }
}

module.exports = {
  modalHelper
}
