const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { getGuild } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { reply, defer, sendToChannel } = require('../helpers/interactionHelper')
const { EMBED_MAX_FIELD_LENGTH, DEFAULT_TIMEOUT, BUTTON_STYLES } = require('../helpers/constants')

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
  const moderatorAlertChannel = await client.channels.cache.find(channel => channel.id === moderatorAlertChannelId)?.fetch()
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
  let modMessage = ''
  if (moderatorRoleId !== '') {
    const moderatorRole = await interaction.guild.roles.cache.find(role => role.id === moderatorRoleId)
    if (moderatorRole) {
      modMessage += `${moderatorRole}\n`
    }
  }
  modMessage += `${interaction.user} heeft een bericht gestuurd:`

  const modEmbed = new MessageEmbed()
  modEmbed.addField('\u2800', message)
  // build confirmation embed
  const confirmationEmbed = new MessageEmbed()
  confirmationEmbed.addField('Je gaat dit bericht naar de moderators sturen:', message)
  confirmationEmbed.setFooter({
    text: 'Bevat het alle informatie die nodig is? Bijvoorbeeld: het kanaal, de gebruikers en een beschrijving van het incident.'
  })

  // Confirm message sent
  const actions = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('yes')
      .setLabel('Ja')
      .setStyle(BUTTON_STYLES.DANGER),
    new MessageButton()
      .setCustomId('no')
      .setLabel('Nee')
      .setStyle(BUTTON_STYLES.SECONDARY)
  )

  const confirmationMessage = await reply(interaction, { content: ' ', embeds: [confirmationEmbed], components: [actions], ephemeral: true })

  const followMsg = await interaction.fetchReply()

  // try {
  const followInteraction = await followMsg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, componentType: 'BUTTON', time: DEFAULT_TIMEOUT })
  confirmationMessage.delete()
  switch (followInteraction.customId) {
    case 'no':
      // TODO: edit original message and delete embed there?
      await reply(interaction, 'Het bericht is niet verstuurd.')
      break
    case 'yes':
      await sendToChannel(interaction, 'Het bericht is verstuurd.')
      await moderatorAlertChannel.send(modMessage)
      await moderatorAlertChannel.send({ embeds: [modEmbed] })
      break
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
