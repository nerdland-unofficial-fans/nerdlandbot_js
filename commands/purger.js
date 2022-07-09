const { SlashCommandBuilder } = require('@discordjs/builders')
const { foemp } = require('../helpers/foemp')
const { reply, defer } = require('../helpers/interactionHelper')
const { verifyAdminAsync } = require('./admin')
const { getGuild, saveGuild } = require('../helpers/guildData')
const { addPurgerAndStartTask, stopTask } = require('../tasks/purgeChannel')
const { MessageEmbed } = require('discord.js')

const cronSyntaxRegex = /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5}/

const addNewPurger = async interaction => {
  if (!await verifyAdminAsync(interaction)) { return }

  const description = interaction.options.getString('description')
  const cronTime = interaction.options.getString('cron_time') ?? '0 0 * * *'
  const maxAge = interaction.options.getInteger('max_age')
  const channel = interaction.channel
  const guild = await getGuild(interaction.guildId)

  if (channel.isVoiceBased) {
    await reply(interaction, `Dat kan niet voor een voicekanaal, ${foemp(interaction)}!`)
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

  const newPurger = { maxAge, channelId: channel.id, description, cronTime }
  guild.purgers[channel.id] = newPurger
  await saveGuild(guild)
  addPurgerAndStartTask(newPurger)
  await reply(interaction, `De purger met omschrijving \`${description}\` is aangemaakt op kanaal ${channel}. max_age: ${maxAge} uur. \`${cronTime}\``)
}

const showAllPurgers = async interaction => {
  if (!await verifyAdminAsync(interaction)) { return }

  const guild = await getGuild(interaction.guildId)
  // Check for existence of purgers
  if (Object.keys(guild.purgers).length === 0) {
    await reply(interaction, 'Er zijn nog geen purgers gemaakt op deze server!')
    return
  }

  // build reply
  const embed = new MessageEmbed()
  const desc = Object.values(guild.purgers).map(
    ({ description, maxAge, cronTime, channelId }) =>
      `\u2022 <#${channelId}> - max ${maxAge} uur. \`${cronTime}\` (${description || 'Geen omschrijving'})`
  ).join('\n')
  embed.setTitle('Purgers')
  embed.setDescription(desc)

  await reply(interaction, { embeds: [embed] })
}

const removePurger = async interaction => {
  if (!await verifyAdminAsync(interaction)) { return }
  const channel = interaction.channel
  const guild = await getGuild(interaction.guildId)

  if (!channel || !guild.purgers[channel.id]) {
    await reply(interaction, 'Er is geen purger gemaakt op dit kanaal!')
    return
  }
  stopTask(channel.id)
  delete guild.purgers[channel.id]
  await saveGuild(guild)
  await reply(interaction, 'done')
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
        option.setName('description').setDescription('Geef deze purger een korte omschrijving').setRequired(true)
      )
      .addStringOption(option =>
        option.setName('cron_time').setDescription('ADVANCED! Wanneer draait dit? (cron syntax) [optioneel, standaard is "0 0 * * *": elke dag om 00h00]')
      )
    )
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('Toont alle bestaande purgers in deze discord')
    )
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Verwijderd een bestaande purge taak van dit kanaal')
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
      case 'list':
        await showAllPurgers(interaction)
        break
    }
  }
}
