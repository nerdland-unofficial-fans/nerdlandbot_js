const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('os')
    .setDescription('Antwoordt met uitleg hoe je kan helpen met het bouwen van deze bot.')
    .addMentionableOption(mention =>
      mention.setName('mention')
        .setDescription('Mention de persoon die wilt helpen met het bouwen van de bot.')
        .setRequired(false)),
  async execute (interaction) {
    const mentionable = interaction.options.getMentionable('mention')
    if (mentionable) {
      interaction.reply({ content: `Hallo ${mentionable}, deze bot is open source. Je kan helpen om me beter te maken door issues aan te maken of software te schrijven die ik nodig heb om te functioneren. Als je niet weet waar je kan beginnen, kan je een issue starten door te klikken op deze link: https://github.com/nerdland-unofficial-fans/nerdlandbot_js/issues/new/choose.`, allowedMentions: { repliedUser: false } })
    } else {
      interaction.reply({ content: 'Hallo, deze bot is open source. Je kan helpen om me beter te maken door issues aan te maken of software te schrijven die ik nodig heb om te functioneren. Als je niet weet waar je kan beginnen, kan je een issue starten door te klikken op deze link: https://github.com/nerdland-unofficial-fans/nerdlandbot_js/issues/new/choose.', allowedMentions: { repliedUser: false } })
    }
  }
}
