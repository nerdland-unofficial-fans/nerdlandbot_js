const { SlashCommandBuilder } = require('@discordjs/builders')
const { foemp } = require('../helpers/foemp')
const { reply, defer } = require('../helpers/interactionHelper')
const { getGuild, saveGuild, verifyAdmin } = require('../helpers/guildData')
const { CRON_REGEX_SYNTAX } = require('../helpers/constants')
const { addPurgerAndStartTask, removePurgeChannelTask } = require('../tasks/purgeChannel')
const { EmbedBuilder, PermissionsBitField } = require('discord.js')
const { ChannelType } = require('discord-api-types/v9')

const cronSyntaxRegex = CRON_REGEX_SYNTAX

async function addNewPurger (interaction) {
  if (!await verifyAdmin(interaction)) { return }

  const cronTime = interaction.options.getString('cron_time') ?? '0 0 * * *'
  const maxAge = interaction.options.getInteger('max_age')
  const channel = interaction.options.getChannel('channel') ?? interaction.channel
  const guild = await getGuild(interaction.guildId)

  if (channel.type === ChannelType.GuildVoice) {
    await reply(interaction, `Dat kan niet voor een voicekanaal, ${foemp(interaction)}!`)
    return
  }
  if (!channel.permissionsFor(interaction.commandGuildId).has([PermissionsBitField.Flags.ManageMessages])) {
    await reply(interaction, `Dit gaat niet want ik heb geen rechten om berichten te wissen in dat kanaal, ${foemp(interaction)}!`)
    return
  }
  if (!cronSyntaxRegex.test(cronTime)) {
    await reply(interaction, `Uw cron syntax is niet correct, ${foemp(interaction)}!`)
    return
  }
  // Error if the purger already exists on the channel
  if (Object.keys(guild.purgers).includes(channel.id)) {
    await reply(interaction, `Er bestaat al een purger voor dit kanaal, ${foemp()}!`)
    return
  }

  const newPurger = { maxAge, channelId: channel.id, cronTime }
  guild.purgers[channel.id] = newPurger
  await saveGuild(guild)
  addPurgerAndStartTask(newPurger)
  await reply(interaction, `De purger is aangemaakt op kanaal ${channel}. max_age: ${maxAge} uur. \`${cronTime}\``)
}

async function showAllPurgers (interaction) {
  if (!await verifyAdmin(interaction)) { return }

  const guild = await getGuild(interaction.guildId)
  // Check for existence of purgers
  if (Object.keys(guild.purgers).length === 0) {
    await reply(interaction, 'Er zijn nog geen purgers gemaakt op deze server!')
    return
  }

  // build reply
  const embed = new EmbedBuilder()
  const embedContent = Object.values(guild.purgers).map(
    ({ maxAge, cronTime, channelId }) =>
      `\u2022 <#${channelId}> - max ${maxAge} uur. \`${cronTime}\` `
  ).join('\n')
  embed.setTitle('Purgers')
  embed.setDescription(embedContent)

  await reply(interaction, { embeds: [embed] })
}

async function removePurger (interaction) {
  if (!await verifyAdmin(interaction)) { return }
  const channel = interaction.options.getChannel('channel') ?? interaction.channel
  const guild = await getGuild(interaction.guildId)

  if (!channel || !guild.purgers[channel.id]) {
    await reply(interaction, `Er is geen purger gemaakt op dit kanaal,  ${foemp()}!`)
    return
  }
  removePurgeChannelTask(guild.purgers[channel.id])
  delete guild.purgers[channel.id]
  await saveGuild(guild)
  await reply(interaction, 'De purger voor dit kanaal is gestopt en verwijderd.')
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purger')
    .setDescription('Purger functionaliteit. Een purger wist regelmatig oude berichten.')
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Voegt een purger taak toe voor dit kanaal. Die wist regelmatig oude berichten.')
      .addIntegerOption(option =>
        option.setName('max_age').setDescription('Hoe oud mogen berichten maximaal zijn, in uren. (max 2 weken)').setRequired(true)
      )
      .addStringOption(option =>
        option.setName('cron_time').setDescription('ADVANCED! Wanneer draait dit? (cron syntax) [optioneel, standaard is "0 0 * * *": elke dag om 00h00]')
      )
      .addChannelOption(option =>
        option.setName('channel').setDescription('Op welk kanaal wil je de purger toevoegen? [optioneel, standaard wordt het huidige kanaal gekozen]')
      )
    )
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Toont alle bestaande purgers in deze discord')
    )
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Verwijderd een bestaande purge taak van dit kanaal')
      .addChannelOption(option =>
        option.setName('channel').setDescription('Op welk kanaal wil je de purger verwijderen? [optioneel, standaard wordt het huidige kanaal gekozen]')
      )
    ),
  async execute (interaction) {
    await defer(interaction, { ephemeral: true })

    switch (interaction.options.getSubcommand()) {
      case 'add':
        await addNewPurger(interaction)
        break
      case 'remove':
        await removePurger(interaction)
        break
      case 'show':
        await showAllPurgers(interaction)
        break
    }
  }
}
