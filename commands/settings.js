const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply, defer } = require('../helpers/interactionHelper')
const { getGuild, saveGuild } = require('../helpers/guildData')
const { verifyAdminAsync } = require('./admin')
const { MessageEmbed } = require('discord.js')
const { foemp } = require('../helpers/foemp')

async function setMemberNotificationChannel (interaction) {
  const channel = interaction.options.getChannel('channel')
  if (channel.isVoice()) {
    await reply(interaction, `Dit gaat niet want het is geen text kanaal, ${foemp(interaction)}!`)
    return
  }
  if (!channel.permissionsFor(interaction.guild.me).has(['SEND_MESSAGES'])) {
    await reply(interaction, `Dit gaat niet want ik heb geen rechten om berichten te sturen in dit kanaal, ${foemp(interaction)}!`)
    return
  }
  const guildData = await getGuild(interaction.guild.id)
  guildData.memberNotificationChannelId = channel.id
  await saveGuild(guildData)
  await reply(interaction, `Ok. Vanaf nu wordt bij elke schijf van ${guildData.memberNotificationNumber} gebruikers een melding geplaatst in het kanaal <#${guildData.memberNotificationChannelId}>.`)
}

async function setMemberNotificationNumber (interaction) {
  const memberNotificationNumber = interaction.options.getInteger('number')
  const guildData = await getGuild(interaction.guild.id)
  guildData.memberNotificationNumber = memberNotificationNumber
  await saveGuild(guildData)
  if (guildData.memberNotificationChannelId) {
    await reply(interaction, `Ok. Vanaf nu wordt bij elke schijf van ${guildData.memberNotificationNumber} gebruikers een melding geplaatst in het kanaal <#${guildData.memberNotificationChannelId}>.`)
  } else {
    await reply(interaction, `Ok. De ingestelde schijf (van aantal gebruikers) wanneer meldingen geplaatst zullen worden is nu ${memberNotificationNumber}. (enkel indien je ook \`set_new_member_notif_channel\` instelt)`)
  }
}

async function clearMemberNotifications (interaction) {
  const guildData = await getGuild(interaction.guild.id)
  guildData.memberNotificationChannelId = ''
  await saveGuild(guildData)
  await reply(interaction, 'Ok. Er worden geen periodieke meldingen meer geplaatst van het aantal gebruikers.')
}

async function showSettings (interaction) {
  const guildData = await getGuild(interaction.guild.id)
  const embed = new MessageEmbed()
  const settings = [
    `\u2022 new_member_notif_number: ${guildData.memberNotificationNumber}`,
    `\u2022 new_member_notif_channel: <#${guildData.memberNotificationChannelId}>`,
    `\u2022 moderator_alert_channel: <#${guildData.moderatorAlertChannelId}>`
  ]
  embed.setTitle('Settings: ')
  embed.setDescription(settings.join('\n'))

  await reply(interaction, { embeds: [embed] })
}

async function setModeratorAlertChannel (interaction) {
  const channel = interaction.options.getChannel('channel')
  if (channel.isVoice()) {
    await reply(interaction, `Dit gaat niet want het is geen text kanaal, ${foemp(interaction)}!`)
    return
  }
  if (!channel.permissionsFor(interaction.guild.me).has(['SEND_MESSAGES'])) {
    await reply(interaction, `Dit gaat niet want ik heb geen rechten om berichten te sturen in dit kanaal, ${foemp(interaction)}!`)
    return
  }
  const guildData = await getGuild(interaction.guild.id)
  guildData.moderatorAlertChannelId = channel.id
  await saveGuild(guildData)
  await reply(interaction, `Ok. Vanaf nu worden moderator alerts geplaatst in het kanaal <#${guildData.memberNotificationChannelId}>.`)
}

async function setChannelPurpose (interaction) {
  const channelPurpose = interaction.options.getString('channel_purpose')
  switch (channelPurpose) {
    case 'member_notification_channel':
      setMemberNotificationChannel(interaction)
      break
    case 'moderator_alert_channel':
      setModeratorAlertChannel(interaction)
      break
  }
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
      .setName('clear_member_notif')
      .setDescription('Verwijder de periodieke notificatie van nieuwe leden')
    )
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Toon alle custom settings')
    )
    .addSubcommand(subcommand => subcommand
      .setName('set_channel_purpose')
      .setDescription('Stel een kanaal in waar berichten naar gestuurd zullen worden')
      .addStringOption(option => option
        .setName('channel_purpose')
        .setRequired(true)
        .setDescription('Voor welke optie wil je het kanaal instellen?')
        .addChoice('Gebruiker notificaties', 'member_notification_channel')
        .addChoice('Moderator alerts', 'moderator_alert_channel')
      )
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('Zet in welk kanaal je de berichten wil zien')
        .setRequired(true)
      )
    ),
  async execute (interaction) {
    if (!await verifyAdminAsync(interaction)) { return }

    await defer(interaction)

    switch (interaction.options.getSubcommand()) {
      case 'set_channel_purpose':
        await setChannelPurpose(interaction)
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
