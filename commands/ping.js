const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
   async execute(interaction) {
    interaction.reply({content:'pong', allowedMentions: { repliedUser: false }});
  }
}
