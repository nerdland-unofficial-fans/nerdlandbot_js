const { ApplicationCommandOptionType } = require('discord.js')
const { getGuild } = require('../helpers/guildData')
const { caseInsensitiveSort } = require('./sortHelper')
const { stringIncludes } = require('./stringHelper')
const { AUTOCOMPLETE_MAX_RESULTS } = require('./constants')
const { defer } = require('./interactionHelper')

async function addAutocompleteOptions (interaction) {
  defer(interaction)
  switch (interaction.commandName) {
    case 'list':
      await addNotifyAutoCompleteOptions(interaction)
      break
    case 'freegames':
      await addFreeGamesAutoCompleteOptions(interaction)
  }
}

async function addNotifyAutoCompleteOptions (interaction) {
  const { subCommand, optionName, optionValue } = parseInteraction(interaction)

  // Build options for option 'naam'
  if (optionName === 'naam') {
    let filter
    if (subCommand === 'sub') {
      const userId = interaction.member.user.id
      filter = (name, subscribers) => (!optionValue || stringIncludes(name, optionValue, false)) && !subscribers.includes(userId)
    } else if (subCommand === 'unsub') {
      const userId = interaction.member.user.id
      filter = (name, subscribers) => (!optionValue || stringIncludes(name, optionValue, false)) && subscribers.includes(userId)
    } else {
      filter = (name, _) => !optionValue || stringIncludes(name, optionValue, false)
    }

    const lists = await getNotifyListsForAutocomplete(interaction, filter)
    await interaction.respond(lists)
  }
}

async function addFreeGamesAutoCompleteOptions (interaction) {
  const { subCommand, optionName } = parseInteraction(interaction)
  if (subCommand === 'add' && optionName === 'list') {
    const lists = await getNotifyListsForAutocomplete(interaction, null)
    await interaction.respond(lists)
  }
}

function parseInteraction (interaction) {
  const subCommand = interaction.options.data.find(o => o.type === ApplicationCommandOptionType.Subcommand)?.name
  const focusedOption = interaction.options.getFocused(true)
  const optionName = focusedOption.name
  const optionValue = focusedOption.value
  return { subCommand, optionName, optionValue }
}

async function getNotifyListsForAutocomplete (interaction, filter) {
  const guild = await getGuild(interaction.guildId)
  const entries = Object.entries(guild.notifyLists)
  if (entries.length === 0) {
    return null
  }

  const filtered = []
  for (const [name, subscribers] of entries) {
    if (!filter || filter(name, subscribers)) {
      filtered.push(name)
    }
  }
  if (filtered.length === 0) {
    return null
  }

  return filtered
    .sort(caseInsensitiveSort)
    .slice(0, AUTOCOMPLETE_MAX_RESULTS)
    .map(name => ({ name, value: name }))
}

module.exports = {
  addAutocompleteOptions
}
