const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply } = require('../helpers/interactionHelper')

const privacyStatement = 'Bij de ontwikkeling van deze bot hebben we privacy bekeken als een zeer belangrijk punt, ' +
                'om die reden hebben we onze mening hierover uitgedrukt in enkele punten.\n\n' +
                'De bot luistert enkel naar slash commands.\n' +
                'De bot zal nooit andere berichten beginnen parsen, ' +
                'ook houden we geen reacties bij, behalve de reacties op berichten van de bot.\n' +
                'De bot houdt geen gebruikersdata bij, behalve het gebruikers-ID, ' +
                'aangezien dit nodig is om gebruikers te taggen.\n' +
                'De bot houdt geen data bij over je berichten, reacties, of andere acties op discord.\n\n' +
                'De logs die we bijhouden worden enkel gebruikt om te debuggen. Deze bevatten geen persoonlijke data.'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('privacy')
    .setDescription('Toon het privacy statement.'),
  async execute (interaction) {
    await reply(interaction, { content: privacyStatement, allowedMentions: { repliedUser: false } })
  }
}
