const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply, defer } = require('../helpers/interactionHelper')
const { getAllCommands, getAllCommandsSync } = require('../helpers/metadataHelper')
const { MessageEmbed } = require('discord.js')

async function buildHelpContent () {
  const embed = new MessageEmbed()
  embed.setTitle('commando\'s:')
  const commands = await getAllCommands()
  for (const command of commands) {
    embed.addField('/' + command.data.name, command.data.description)
  }
  return embed
}

async function buildDetailHelpContent (commandName) {
  const command = (await getAllCommands()).filter(c => c.data.name === commandName)[0]

  const embed = new MessageEmbed()
  embed.setTitle(command.data.name)
  embed.setDescription(command.data.description)

  if (command.data.options.length > 0) {
    for (const sub of command.data.options) {
      // if the current option has no options array it is not a subcommand
      if (!sub.options) { continue }
      const subName = `/${command.data.name} ${sub.name}`
      embed.addField(subName, sub.description)
    }
  }
  return embed
}

function buildChoices (option) {
  const commands = getAllCommandsSync(['help.js']).map(c => c.data.name)
  commands.push('help')
  for (const c of commands) {
    option.addChoice(`${c}`, `${c}`)
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
