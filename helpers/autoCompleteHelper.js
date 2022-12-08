const { ApplicationCommandOptionType } = require('discord.js')
const { getGuild } = require('../helpers/guildData')
const { caseInsensitiveSort } = require('./sortHelper')
const { stringIncludes } = require('./stringHelper')
const { AUTOCOMPLETE_MAX_RESULTS } = require('./constants')

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
      filter = (name, subscribers) => (!optionValue || stringIncludes(name, optionValue, false)) && !subscribers.includes(userId)
    } else if (subcommand === 'unsub') {
      filter = (name, subscribers) => (!optionValue || stringIncludes(name, optionValue, false)) && subscribers.includes(userId)
    } else {
      filter = (name, _) => !optionValue || stringIncludes(name, optionValue, false)
    }

    // check for data
    const entries = Object.entries(lists)
    if (entries.length === 0) {
      await interaction.respond(null)
      return
    }

    // filter data
    const filteredLists = []
    for (const [name, subscribers] of entries) {
      if (filter(name, subscribers)) {
        filteredLists.push(name)
      }
    }

    // sort data
    const options = filteredLists
      .sort(caseInsensitiveSort)
      .map(name => ({ name, value: name }))
      .slice(0, AUTOCOMPLETE_MAX_RESULTS)

    // return data
    await interaction.respond(options)
  }
}

module.exports = {
  addAutocompleteOptions
}
