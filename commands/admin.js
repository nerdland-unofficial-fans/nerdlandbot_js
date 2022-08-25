const { PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js')
const { getGuild, verifyAdmin, AddAdminToGuild, removeAdminFromGuild } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { reply, defer } = require('../helpers/interactionHelper')
const { DEFAULT_TIMEOUT } = require('../helpers/constants')

async function listAdmins (interaction) {
  const guild = await getGuild(interaction.guildId)

  // Check existence of admins
  if (guild.admins.length === 0) {
    await reply(interaction, 'Er zijn nog geen bot admins aangeduid op deze server!')
    return
  }

  // Build reply
  const memberManager = interaction.guild.members
  const admins = await memberManager.fetch({ user: guild.admins })
  let response = 'De bot admins voor deze server zijn:'
  for (const [, admin] of admins) { response += `\n${admin.displayName}` }
  await reply(interaction, response)
}

async function addAdmin (interaction) {
  // Verify access level of user executing the command
  if (!await verifyAdmin(interaction)) { return }

  const user = interaction.options.getUser('target')
  const member = await interaction.guild.members.fetch(user.id)
  const guild = await getGuild(interaction.guildId)

  // Error if the target already is a bot admin
  if (guild.admins.includes(user.id)) {
    await reply(interaction, `${member.displayName} is al een bot admin, ${foemp(interaction)}!`)
    return
  }

  // Error if the target already is a server admin
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await reply(interaction, `${member.displayName} is al een server admin, het is niet nodig om hem/haar/helicopter ook bot admin te maken, ${foemp(interaction)}!`)
    return
  }

  // Promote the target to bot admin
  await AddAdminToGuild(guild, user.id)
  await reply(interaction, `${member.displayName} is nu een bot admin.`)
}

async function removeAdmin (interaction) {
  // Verify access level of user executing the command
  if (!await verifyAdmin(interaction)) { return }

  const user = interaction.options.getUser('target')
  const member = await interaction.guild.members.fetch(user.id)
  const guild = await getGuild(interaction.guildId)

  // Error if the target is not a bot admin
  if (!guild.admins.includes(user.id)) {
    await reply(interaction, `${member.displayName} is geen bot admin, ${foemp(interaction)}!`)
    return
  }

  let question = ''
  if (interaction.member.user.id === user.id) { question = 'Weet je zeker dat je je eigen bot admin rechten wilt intrekken?' } else { question = `Weet je zeker dat je de bot admin rechten van ${member.displayName} wilt intrekken?` }

  // Confirm demotion
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

  const followMsg = await interaction.followUp({ content: question, components: [actions] })
  const followInteraction = await followMsg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: DEFAULT_TIMEOUT, ephemeral: true })
  await defer(followInteraction)
  await reply(interaction, { content: question, components: [] })
  switch (followInteraction.customId) {
    case 'no':
      await reply(followInteraction, { content: `${member.displayName} mag bot admin blijven! Yay!`, components: [] })
      break
    case 'yes':
      // Demote the bot admin to a regular user
      await removeAdminFromGuild(guild, user.id)
      await reply(followInteraction, { content: `${member.displayName} is geen bot admin meer.`, components: [] })
      break
  }
}

module.exports = {

  data: new SlashCommandBuilder()
    .setName('admins')
    .setDescription('bot-admin functionaliteiten')
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Toont de lijst van bot-admins.'))
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Voeg een nieuwe bot admin toe.')
      .addUserOption(useroption => useroption
        .setName('target')
        .setDescription('De gebruiker om als bot admin te benoemen.')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Verwijdert een bot admin.')
      .addUserOption(useroption => useroption
        .setName('target')
        .setDescription('De gebruiker waarvan de admin rechten verdwijnen.')
        .setRequired(true))),

  async execute (interaction) {
    if (!interaction.guild) {
      await reply(interaction, 'Dit commando kan niet gebruikt worden in een priv\u00e9bericht, enkel het moderator commando kan hier gebruikt worden.')
      return
    }
    await defer(interaction)

    switch (interaction.options.getSubcommand()) {
      case 'add':
        await addAdmin(interaction)
        break
      case 'remove':
        await removeAdmin(interaction)
        break
      case 'info':
      default:
        await listAdmins(interaction)
        break
    }
  }
}
