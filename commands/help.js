const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply, defer } = require('../helpers/interactionHelper')
const { getAllCommands, getAllCommandsSync } = require('../helpers/metadataHelper')
const { EmbedBuilder } = require('discord.js')

async function buildHelpContent () {
  const embed = new EmbedBuilder()
  embed.setTitle('commando\'s:')
  const commands = await getAllCommands()
  embed.addFields(commands.map(c => ({ name: '/' + c.data.name, value: c.data.description })))
  return embed
}

async function buildDetailHelpContent (commandName) {
  const command = (await getAllCommands()).filter(c => c.data.name === commandName)[0]

  const embed = new EmbedBuilder()
  embed.setTitle(command.data.name)
  embed.setDescription(command.data.description)

  if (command.data.options.length > 0) {
    embed.addFields(
      command.data.options
        .filter(o => o.options)
        .map(o => ({ name: `/${command.data.name} ${o.name}`, value: o.description }))
    )
  }
  return embed
}

function buildChoices (option) {
  const commands = getAllCommandsSync(['help.js']).map(c => c.data.name)
  commands.push('help')
  for (const c of commands) {
    option.addChoices({ name: c, value: c })
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Toont een overzicht van de beschikbare commando\'s van deze bot')
    .addStringOption(option => {
      option
        .setName('commando')
        .setDescription('Toont alle subcommando\'s voor het gegeven commando')
        .setRequired(false)
      buildChoices(option)
      return option
    }),

  async execute (interaction) {
    await defer(interaction)

    const command = interaction.options.getString('commando')
    if (command === null) {
      await reply(interaction, { content: ' ', embeds: [await buildHelpContent()] })
    } else {
      await reply(interaction, { content: ' ', embeds: [await buildDetailHelpContent(command)] })
    }
  }
}
