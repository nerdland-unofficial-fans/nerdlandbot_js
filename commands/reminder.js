const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, InteractionContextType } = require('discord.js')
const { MODAL_IDS } = require('../helpers/constants')

async function setReminder (interaction) {
  const modal = new ModalBuilder()
    .setCustomId(MODAL_IDS.REMINDER_MODAL)
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
    .setDescription('Stel een herinnering in.')
    .setContexts(InteractionContextType.Guild),

  async execute (interaction) {
    setReminder(interaction)
  }
}
