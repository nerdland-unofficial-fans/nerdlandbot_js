const { SlashCommandBuilder } = require('@discordjs/builders')
const { foemp } = require('../helpers/foemp')
const { reply, defer } = require('../helpers/interactionHelper')
const { getGuild, saveGuild, verifyAdmin } = require('../helpers/guildData')
const { addFreeGamesNotifierAndStartTask, removeFreeGamesNotifierTask } = require('../tasks/freeGamesNotifier')
const { EmbedBuilder } = require('discord.js')
const { ChannelType } = require('discord-api-types/v9')

async function addNewFreeGamesNotifier (interaction) {
  if (!await verifyAdmin(interaction)) { return }

  const channel = interaction.options.getChannel('channel') ?? interaction.channel
  const listName = interaction.options.getString('list')
  const guild = await getGuild(interaction.guildId)

  if (channel.type === ChannelType.GuildVoice) {
    await reply(interaction, `Dat kan niet voor een voicekanaal, ${foemp(interaction)}!`)
    return
  }

  if (guild.freeGamesChecker) {
    await reply(interaction, `Er is al een gratis games melder ingesteld, ${foemp()}!`)
    return
  }

  guild.freeGamesChecker = { channelId: channel.id, listName }
  await saveGuild(guild)
  addFreeGamesNotifierAndStartTask(guild.id, guild.freeGamesChecker)
  await reply(interaction, `De gratis games melder is aangemaakt op kanaal ${channel}.`)
}

async function showFreeGamesNotifier (interaction) {
  if (!await verifyAdmin(interaction)) { return }

  const guild = await getGuild(interaction.guildId)
  if (!guild.freeGamesChecker) {
    await reply(interaction, 'Er is geen gratis games melder ingesteld op deze server!')
    return
  }

  // build reply
  const embed = new EmbedBuilder()
  const embedContent = `\u2022 <#${guild.freeGamesChecker.channelId}> met lijst **${guild.freeGamesChecker.listName}**`
  embed.setTitle('Gratis games melder')
  embed.setDescription(embedContent)

  await reply(interaction, { embeds: [embed] })
}

async function removeFreeGamesNotifier (interaction) {
  if (!await verifyAdmin(interaction)) { return }
  const guild = await getGuild(interaction.guildId)

  removeFreeGamesNotifierTask(interaction.guildId)
  delete guild.freeGamesChecker
  await saveGuild(guild)
  await reply(interaction, 'De gratis games melder is gestopt en verwijderd.')
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('freegames')
    .setDescription('Laat wekelijks op vrijdag weten welke gratis games beschikbaar zijn op Epic Games Store.')

    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Voegt een gratis games melder taak toe voor dit kanaal.')
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('Op welk kanaal wil je de melder toevoegen? [optioneel, standaard wordt het huidige kanaal gekozen]'))
      .addStringOption(option => option
        .setName('list')
        .setDescription('Welke lijst wil je gebruiken?')
        .setAutocomplete(true)))

    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Toont de bestaande gratis games melder'))

    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Verwijdert de gratis games melder.')),

  async execute (interaction) {
    await defer(interaction, { ephemeral: true })

    switch (interaction.options.getSubcommand()) {
      case 'add':
        await addNewFreeGamesNotifier(interaction)
        break
      case 'remove':
        await removeFreeGamesNotifier(interaction)
        break
      case 'show':
        await showFreeGamesNotifier(interaction)
        break
    }
  }
}
