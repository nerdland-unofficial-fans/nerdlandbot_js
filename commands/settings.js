const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply, defer } = require('../helpers/interactionHelper')
const { getGuild, saveGuild } = require('../helpers/guildData')
const { verifyAdminAsync } = require('./admin')
const { MessageEmbed } = require('discord.js')

const setMemberNotificationChannel = async interaction => {
  const channel = interaction.options.getChannel('channel')
  const guildData = await getGuild(interaction.guild.id)
  guildData.memberNotificationChannelId = channel.id
  await saveGuild(guildData)
  await reply(interaction, 'ok')
}

const setMemberNotificationNumber = async interaction => {
  const memberNotificationNumber = interaction.options.getInteger('number')
  const guildData = await getGuild(interaction.guild.id)
  guildData.memberNotificationNumber = memberNotificationNumber
  await saveGuild(guildData)
  await reply(interaction, 'ok')
}

const clearMemberNotifications = async interaction => {
  const guildData = await getGuild(interaction.guild.id)
  guildData.memberNotificationChannelId = ''
  await saveGuild(guildData)
  await reply(interaction, 'ok')
}

const showSettings = async interaction => {
  const guildData = await getGuild(interaction.guild.id)
  const embed = new MessageEmbed()
  const settings = [
    `\u2022 new_member_notif_number: ${guildData.memberNotificationNumber}`,
    `\u2022 new_member_notif_channel: <#${guildData.memberNotificationChannelId}>`
  ]
  embed.setTitle('Settings: ')
  embed.setDescription(settings.join('\n'))

  await reply(interaction, { embeds: [embed] })
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Instellingen (Admin functies)')
    .addSubcommand(subcommand => subcommand
      .setName('set_new_member_notif_number')
      .setDescription('Zet na hoeveel nieuwe leden de bot het aantal plaatst in het notificatie kanaal')
      .addIntegerOption(option => option
        .setName('number')
        .setDescription('Zet na hoeveel nieuwe leden de bot het aantal plaatst in het notificatie kanaal')
        .setRequired(true)
      )
    )
    .addSubcommand(subcommand => subcommand
      .setName('set_new_member_notif_channel')
      .setDescription('Zet in welk kanaal je periodiek het aantal wil zien')
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('Zet in welk kanaal je periodiek het aantal wil zien')
        .setRequired(true)
      )
    )
    .addSubcommand(subcommand => subcommand
      .setName('clear_member_notif')
      .setDescription('Verwijder de periodieke notificatie van nieuwe leden')
    )
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Toon alle custom settings')
    ),
  async execute (interaction) {
    if (!await verifyAdminAsync(interaction)) { return }

    await defer(interaction)

    switch (interaction.options.getSubcommand()) {
      case 'set_new_member_notif_channel':
        await setMemberNotificationChannel(interaction)
        break
      case 'set_new_member_notif_number':
        await setMemberNotificationNumber(interaction)
        break
      case 'clear_member_notif':
        await clearMemberNotifications(interaction)
        break
      case 'show':
        await showSettings(interaction)
        break
    }
  }

}
