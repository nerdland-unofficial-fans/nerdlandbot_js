const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply, defer } = require('../helpers/interactionHelper')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Telt het aantal leden in deze discord.')
    .addBooleanOption((useroption) =>
      useroption.setName('online').setDescription('toon enkel online gebruikers [optioneel]')
    )
    .addChannelOption((useroption) =>
      useroption.setName('channel').setDescription('van welk kanaal wil je het aantal zien [optioneel]')
    ),
  async execute (interaction) {
    await defer(interaction)
    const channel = interaction.options.getChannel('channel')
    const onlyShowOnline = interaction.options.getBoolean('online')
    // get either the members of a channel, or from the whole server
    const members = (await channel?.fetch())?.members ?? await interaction.guild.members.fetch()

    const memberCount = members.filter((member) => {
      if (member.user.bot) {
        // don't count bots in any case
        return false
      }

      if (onlyShowOnline === null) {
        // if onlyShowOnline is not provided => always count
        return true
      } else {
      // if onlyShowOnline is provided, then count only where the status matches the requested online status
        if (onlyShowOnline) {
          return member.presence?.status && member.presence.status !== 'offline'
        } else {
          return !member.presence?.status || member.presence.status === 'offline'
        }
      }
    }).size
    const channelOrServer = channel || interaction.guild.name

    // TODO: crude pluralization below, can eventually be fixed when/if decent i18n support is added
    const amountOfUsers = `${memberCount} gebruiker${memberCount === 1 ? '' : 's'}`

    await reply(interaction, {
      content: onlyShowOnline === null
        ? `Er ${memberCount === 1 ? 'zit' : 'zitten'} momenteel ${amountOfUsers} in ${channelOrServer}!`
        : `Er ${memberCount === 1 ? 'is' : 'zijn'} momenteel ${amountOfUsers} ${onlyShowOnline ? 'online' : 'offline'} in ${channelOrServer}!`,
      allowedMentions: { repliedUser: false, ephemeral: true }
    })
  }
}
