async function defer (interaction, options = { ephemeral: false }) {
  if (interaction.isApplicationCommand() || interaction.isMessageComponent()) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply(options)
    }
  }
}

async function reply (interaction, response) {
  if (interaction.isApplicationCommand() || interaction.isMessageComponent()) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(response)
    } else {
      await interaction.reply(response)
    }
  }
}

module.exports = {
  defer,
  reply
}
