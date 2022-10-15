async function defer (interaction, options = { ephemeral: false }) {
  if (interaction.isCommand() || interaction.isMessageComponent()) {
    if (!interaction.deferred && !interaction.replied) {
      return await interaction.deferReply(options)
    }
  }
}

async function reply (interaction, response) {
  if (interaction.isCommand() || interaction.isMessageComponent()) {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(response)
    } else {
      return await interaction.reply(response)
    }
  }
}

async function sendToChannel (interaction, msg) {
  return await interaction.channel.send(msg)
}

module.exports = {
  defer,
  reply,
  sendToChannel
}
