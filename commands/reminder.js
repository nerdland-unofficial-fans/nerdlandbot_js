const { SlashCommandBuilder } = require('@discordjs/builders')
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js')
// const { reply } = require('../helpers/interactionHelper')

async function replyToInteraction (interaction) {
  const modal = new ModalBuilder()
    .setCustomId('reminderModal')
    .setTitle('Stel je herinnering hier in')

  const reminderInput = new TextInputBuilder()
    .setCustomId('reminderTime')
    .setLabel('Over hoeveel minuten moet ik je herinneren?')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(10)
    .setPlaceholder('Aantal minuten')
    .setValue('5')
    .setRequired(true)

  const reminderMessage = new TextInputBuilder()
    .setCustomId('reminderMessage')
    .setLabel('Aan wat wil je herinnerd worden?')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1500)

  const firstActionRow = new ActionRowBuilder().addComponents(reminderInput)
  const secondActionRow = new ActionRowBuilder().addComponents(reminderMessage)

  modal.addComponents(firstActionRow, secondActionRow)

  await interaction.showModal(modal)
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Stel een herinnering in.'),

  async execute (interaction) {
    replyToInteraction(interaction)
  }
}
