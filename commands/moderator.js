const { SlashCommandBuilder } = require('@discordjs/builders')
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ChannelType } = require('discord.js')
const { getGuild } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { reply, defer } = require('../helpers/interactionHelper')
const { EMBED_MAX_FIELD_LENGTH, DEFAULT_TIMEOUT } = require('../helpers/constants')

async function alertModerator (interaction) {
  const serverId = process.env.NERDLAND_SERVER_ID

  const guild = await getGuild(serverId)

  const message = interaction.options.getString('message')
  const client = interaction.client

  const moderatorAlertChannelId = guild.moderatorAlertChannelId
  const moderatorRoleId = guild.moderatorRoleId

  // check whether the moderator alert channel is already set
  if (moderatorAlertChannelId === '') {
    await reply(interaction, 'Er is nog geen kanaal ingesteld om de moderators een bericht te sturen.')
    return
  }

  // check whether channel still exists
  const moderatorAlertChannel = await client.channels.cache.get(moderatorAlertChannelId)
  if (!moderatorAlertChannel) {
    await reply(interaction, 'Ik kan het kanaal niet vinden om een bericht naar de moderators te sturen.')
    return
  }

  // check wheter or not message is too long
  if (message && message.length > EMBED_MAX_FIELD_LENGTH) {
    await reply(interaction, `Je bericht is ${message.length - EMBED_MAX_FIELD_LENGTH} karakters te lang, ${foemp()}`)
    return
  }

  // check whether moderator role is set and still exists
  const nerdlandGuild = client.guilds.cache.get(serverId)
  let modMessage = ''
  if (moderatorRoleId !== '') {
    const moderatorRole = await nerdlandGuild.roles.cache.find(role => role.id === moderatorRoleId)
    if (moderatorRole) {
      modMessage += `${moderatorRole}\n`
    }
  }
  modMessage += `${interaction.user} heeft een bericht gestuurd:`

  const modEmbed = new EmbedBuilder()
  modEmbed.addFields([{ name: '\u2800', value: message }])
  // build confirmation embed
  const confirmationEmbed = new EmbedBuilder()
  confirmationEmbed.addFields([{ name: 'Je gaat dit bericht naar de moderators sturen:', value: message }])
  confirmationEmbed.setFooter({
    text: 'Bevat het alle informatie die nodig is? Bijvoorbeeld: het kanaal, de gebruikers en een beschrijving van het incident.'
  })

  // Confirm message sent
  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('yes')
      .setLabel('Ja')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('no')
      .setLabel('nee')
      .setStyle(ButtonStyle.Secondary)
  )

  const followMsg = await interaction.followUp({ content: ' ', embeds: [confirmationEmbed], components: [actions], ephemeral: true })

  // try {
  const followInteraction = await followMsg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: DEFAULT_TIMEOUT })
  await defer(followInteraction)
  await reply(interaction, { content: ' ', components: [] })

  switch (followInteraction.customId) {
    case 'no':
      // TODO: edit original message and delete embed there?
      await reply(followInteraction, 'Het bericht is niet verstuurd.')
      break
    case 'yes':
      await reply(followInteraction, 'Het bericht is verstuurd.')
      await moderatorAlertChannel.send(modMessage)
      await moderatorAlertChannel.send({ embeds: [modEmbed] })
      break
  }
  if (!interaction.channel.type === ChannelType.DM) {
    followMsg.delete()
  }
  // } catch (error) {
  //   console.log(error)
  //   confirmationMessage.delete()
  //   await sendToChannel(interaction, `Te traag, ${foemp()}`)
  // }
}

module.exports = {

  data: new SlashCommandBuilder()
    .setName('moderator')
    .setDescription('Stuur een moderator alert')
    .addStringOption(stringoption => stringoption
      .setName('message')
      .setDescription('Het bericht om naar de moderators te sturen.')
      .setRequired(true)),

  async execute (interaction) {
    await defer(interaction)
    await alertModerator(interaction)
  }
}
