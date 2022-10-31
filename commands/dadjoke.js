const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply } = require('../helpers/interactionHelper')
const { DAD_JOKE_URL } = require('../helpers/constants')
const axios = require('axios')

const data = new SlashCommandBuilder()
  .setName('dadjoke')
  .setDescription('Geeft een al dan niet flauwe mop')

async function execute (interaction) {
  const joke = (
    await axios.get(DAD_JOKE_URL, {
      headers: { Accept: 'text/plain', 'User-Agent': 'axios 0.21.1' }
    })
  ).data

  await reply(interaction, {
    content: joke,
    allowedMentions: { repliedUser: false }
  })
}

module.exports = {
  data,
  execute
}
