const { SlashCommandBuilder } = require('@discordjs/builders')
const { Permissions, MessageActionRow, MessageButton } = require('discord.js')
const { getGuild, saveGuild } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { reply, defer } = require('../helpers/interactionHelper')
const { removeElementFromArray } = require('../helpers/arrayHelper')
const { BUTTON_STYLES, DEFAULT_TIMEOUT } = require('../helpers/constants')

async function verifyAdmin (interaction) {
  const user = interaction.member
  const guild = await getGuild(interaction.guildId)

  const isGuildAdmin = user.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
  const isBotAdmin = guild.admins.includes(user.id)

  if (!isGuildAdmin && !isBotAdmin) {
    await reply(interaction, 'https://gph.is/g/4w8PDNj')
    return false
  }
  return true
}

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
  for (const [, admin] of admins) { response += `\n${admin.user.username}` }
  await reply(interaction, response)
}

async function addAdmin (interaction) {
  // Verify access level of user executing the command
  if (!await verifyAdmin(interaction)) { return }

  const user = interaction.options.getUser('target')
  const guild = await getGuild(interaction.guildId)

  // Error if the target already is a bot admin
  if (guild.admins.includes(user.id)) {
    await reply(interaction, `${user.username} is al een bot admin, ${foemp()}!`)
    return
  }

  const member = await interaction.guild.members.fetch(user.id)

  // Error if the target already is a server admin
  if (member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
    await reply(interaction, `${user.username} is al een server admin, het is niet nodig om hem/haar/helicopter ook bot admin te maken, ${foemp()}!`)
    return
  }

  // Promote the target to bot admin
  guild.admins.push(user.id)
  await saveGuild(guild)
  await reply(interaction, `${user.username} is nu een bot admin.`)
}

async function removeAdmin (interaction) {
  // Verify access level of user executing the command
  if (!await verifyAdmin(interaction)) { return }

  const user = interaction.options.getUser('target')
  const guild = await getGuild(interaction.guildId)

  // Error if the target is not a bot admin
  if (!guild.admins.includes(user.id)) {
    await reply(interaction, `${user.username} is geen bot admin, ${foemp()}!`)
    return
  }

  let question = ''
  if (interaction.member.user.id === user.id) { question = 'Weet je zeker dat je je eigen bot admin rechten wilt intrekken?' } else { question = `Weet je zeker dat je de bot admin rechten van ${user.username} wilt intrekken?` }

  // Confirm demotion
  const actions = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('yes')
      .setLabel('Ja')
      .setStyle(BUTTON_STYLES.DANGER),
    new MessageButton()
      .setCustomId('no')
      .setLabel('nee')
      .setStyle(BUTTON_STYLES.SECONDARY)
  )
  await reply(interaction, { content: question, components: [actions] })

  const followMsg = await interaction.fetchReply()
  const followInteraction = await followMsg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, componentType: 'BUTTON', time: DEFAULT_TIMEOUT })
  await defer(followInteraction)
  switch (interaction.customId) {
    case 'no':
      await reply(interaction, { content: `${user.username} mag bot admin blijven! Yay!`, components: [] })
      break
    case 'yes':
      // Demote the bot admin to a regular user
      removeElementFromArray(guild.admins, user.id)
      await saveGuild(guild)
      await reply(interaction, { content: `${user.username} is geen bot admin meer.`, components: [] })
      break
  }
}

module.exports = {
  verifyAdminAsync: verifyAdmin,

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
