const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply, defer } = require('../helpers/interactionHelper')
const { getGuild, saveGuild, verifyAdmin } = require('../helpers/guildData')
const { EmbedBuilder, PermissionsBitField } = require('discord.js')
const { foemp } = require('../helpers/foemp')
const { ChannelType } = require('discord-api-types/v9')

async function setMemberNotificationChannel (interaction) {
  const channel = interaction.options.getChannel('channel')
  if (channel.type === ChannelType.GuildVoice) {
    await reply(interaction, `Dit gaat niet want het is geen text kanaal, ${foemp(interaction)}!`)
    return
  }
  if (!channel.permissionsFor(interaction.applicationId).has([PermissionsBitField.Flags.SendMessages])) {
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

async function setReminderChannel (interaction) {
  const reminderChannel = interaction.options.getChannel('channel')
  const guildData = await getGuild(interaction.guildId)
  guildData.reminderChannel = reminderChannel.id
  await saveGuild(guildData)
  await reply(interaction, 'Ok, ingesteld!')
}

async function clearReminderChannel (interaction) {
  const guildData = await getGuild(interaction.guild.id)
  guildData.reminderChannel = ''
  await saveGuild(guildData)
  await reply(interaction, 'Ok. Er worden geen herinneringen meer geplaatst in deze server. De gebruikers zullen een DM krijgen.')
}

async function showSettings (interaction) {
  const guildData = await getGuild(interaction.guild.id)
  const embed = new EmbedBuilder()
  const settings = [
    `\u2022 new_member_notif_number: ${guildData.memberNotificationNumber}`,
    `\u2022 new_member_notif_channel: <#${guildData.memberNotificationChannelId}>`,
    `\u2022 reminder_channel: <#${guildData.reminderChannel}>`
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
      .setName('set_reminder_channel')
      .setDescription('Zet in welk kanaal je herinneringen wilt zien')
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('Zet in welk kanaal je herinneringen wilt zien')
        .setRequired(true)
      )
    )
    .addSubcommand(subcommand => subcommand
      .setName('clear_reminder_channel')
      .setDescription('Ontkoppel het reminder kanaal.')
    )
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Toon alle custom settings')
    ),
  async execute (interaction) {
    if (!await verifyAdmin(interaction)) { return }

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
      case 'set_reminder_channel':
        await setReminderChannel(interaction)
        break
      case 'clear_reminder_channel':
        await clearReminderChannel(interaction)
        break
      case 'show':
        await showSettings(interaction)
        break
    }
  }

}
