const { ApplicationCommandOptionType } = require('discord.js')
const { getGuild } = require('../helpers/guildData')

async function addAutocompleteOptions (interaction) {
  switch (interaction.commandName) {
    case 'list':
      await addNotifyAutoCompleteOptions(interaction)
      break
  }
}

async function addNotifyAutoCompleteOptions (interaction) {
  // fetch subcommand to autocomplete for
  const subcommand = interaction.options.data.find(o => o.type === ApplicationCommandOptionType.Subcommand)?.name
  if (!subcommand) {
    return
  }

  // get option to autocomplete
  const focusedOption = interaction.options.getFocused(true)
  const optionName = focusedOption.name
  const optionValue = focusedOption.value

  // Build options for option 'naam'
  if (optionName === 'naam') {
    const userId = interaction.member.user.id
    const guild = await getGuild(interaction.guildId)
    const lists = guild.notifyLists

    let filter
    if (subcommand === 'sub') {
      filter = (name, subscribers) => (!optionValue || name.includes(optionValue)) && !subscribers.includes(userId)
    } else if (subcommand === 'unsub') {
      filter = (name, subscribers) => (!optionValue || name.includes(optionValue)) && subscribers.includes(userId)
    } else {
      filter = (name, _) => !optionValue || name.includes(optionValue)
    }

    const options = []
    if (Object.keys(lists).length > 0) {
      for (const [name, subscribers] of Object.entries(lists)) {
        if (filter(name, subscribers)) {
          options.push(({ name, value: name }))
        }
      }
    }

    await interaction.respond(options, null)
  }
}

module.exports = {
  addAutocompleteOptions
}
