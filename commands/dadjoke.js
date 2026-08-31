const { SlashCommandBuilder } = require('discord.js')
const { reply } = require('../helpers/interactionHelper')
const { DAD_JOKE_URL } = require('../helpers/constants')
const axios = require('axios')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dadjoke')
    .setDescription('Geeft een al dan niet flauwe mop'),
  async execute (interaction) {
    const joke = (
      await axios.get(DAD_JOKE_URL, {
        headers: { Accept: 'text/plain', 'User-Agent': 'nerdlandbot_js/1.0' }
      })
    ).data

    await reply(interaction, {
      content: joke,
      allowedMentions: { repliedUser: false }
    })
  }
}
