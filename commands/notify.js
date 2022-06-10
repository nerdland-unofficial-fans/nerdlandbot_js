const { SlashCommandBuilder } = require('@discordjs/builders')
const { getGuild, saveGuild } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { reply, defer } = require('../helpers/interactionHelper')
const { verifyAdminAsync } = require('./admin')
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js')
const { DEFAULT_TIMEOUT } = require('../helpers/constants')

async function addNewList (interaction) {
  // Verify permissions
  if (!await verifyAdminAsync(interaction)) { return }

  // Parse arguments from command
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('name')

  // Check if list exists
  if (Object.keys(guild.notifyLists).map(notifyList => notifyList.toLowerCase()).includes(listName.toLowerCase())) {
    await reply(interaction, `De lijst '${listName}' bestaat al, ${foemp()}!`)
    return
  }

  // create list
  guild.notifyLists[listName] = []
  await saveGuild(guild)
  await reply(interaction, `De lijst ${listName} is aangemaakt!`)
}

async function removeList (interaction) {
  // Verify permissions
  if (!await verifyAdminAsync(interaction)) { return }

  // Parse command arguments
  const guild = await getGuild(interaction.guildId)
  let listName = interaction.options.getString('name')

  // if no argument was passed, request one
  if (!listName) {
    // return if the server has no lists to remove
    if (Object.keys(guild.notifyLists).length === 0) {
      await reply(interaction, 'Er zijn nog geen lijstjes gemaakt op deze server!')
      return
    }

    // request listname from user
    listName = await DisplayListSelector(interaction, guild, 'Selecteer een lijst om te verwijderen.')
  }

  // check if list exists
  if (!Object.keys(guild.notifyLists).includes(listName)) {
    await reply(interaction, `De lijst ${listName} bestaat niet, ${foemp()}!`)
    return
  }

  delete guild.notifyLists[listName]
  await saveGuild(guild)
  await reply(interaction, `De lijst ${listName} is verwijderd!`)
}

async function renameList (interaction) {
  if (!await verifyAdminAsync(interaction)) { return }

  const guild = await getGuild(interaction.guildId)
  const oldName = interaction.options.getString('old')
  const newName = interaction.options.getString('new')

  // if no valid argument was passed for oldName, request one
  if (!oldName || !Object.keys(guild.notifyLists).includes(oldName)) {
    // check if there are any lists to rename
    if (Object.keys(guild.notifyLists).length === 0) {
      await reply(interaction, 'Er zijn nog geen lijstjes gemaakt op deze server!')
      return
    }

    if (!Object.keys(guild.notifyLists).includes(oldName)) {
      await reply(interaction, `De lijst '${oldName}' bestaat niet, ${foemp()}!`)
      return
    }
  }

  // if no newName was passed, request one
  if (!newName) {
    await reply(interaction, `Je hebt geen nieuwe naam opgegeven voor '${oldName}', ${foemp()}!`)
  }

  // update the lists
  guild.notifyLists[newName] = guild.notifyLists[oldName]
  delete guild.notifyLists[oldName]
  await saveGuild(guild)

  // send reply
  await reply(interaction, `De lijst '${oldName}' heet nu '${newName}'.`)
}

async function showAllLists (interaction) {
  const guild = await getGuild(interaction.guildId)

  // Check for existence of lists
  if (Object.keys(guild.notifyLists).length === 0) {
    await reply(interaction, 'Er zijn nog geen lijstjes gemaakt op deze server!')
    return
  }

  // build reply
  const embed = new MessageEmbed()
  let desc = ''
  for (const list in guild.notifyLists) {
    desc += `\u2022 ${list}\n`
  }
  embed.setTitle('Lijstjes')
  embed.setDescription(desc)

  await reply(interaction, { embeds: [embed] })
}

async function DisplayListSelector (interaction, guild, question) {
  const options = []
  for (const list in guild.notifyLists) {
    options.push({
      label: list,
      value: list
    })
  }

  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageSelectMenu()
        .setCustomId('select')
        .setPlaceholder('Kies een lijst...')
        .addOptions(options)
    )

  const followMsg = await interaction.followUp({ content: question, components: [actionRow] })
  const followInteraction = await followMsg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, componentType: 'SELECT_MENU', time: DEFAULT_TIMEOUT, ephemeral: true })
  const listName = followInteraction.values[0]
  await followMsg.delete()
  return listName
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notify')
    .setDescription('notify functionaliteit.')

    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Voeg een nieuwe lijst toe.')
      .addStringOption(stringoption => stringoption
        .setName('name')
        .setDescription('De naam van de lijst om toe te voegen.')
        .setRequired(true)))

    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Verwijder een bestaande lijst.')
      .addStringOption(stringoption => stringoption
        .setName('name')
        .setDescription('De naam van de lijst om te verwijderen.')
        .setRequired(false)))

    // TODO it would be nice to make the parameters optional here,
    // but at the time of writing it is not yet possible to request text input through a messageActionRow
    // to ensure the new list name is set
    .addSubcommand(subcommand => subcommand
      .setName('rename')
      .setDescription('de naam van een lijst wijzigen.')
      .addStringOption(stringoption => stringoption
        .setName('old')
        .setDescription('de lijst die je wenst te hernoemen.')
        .setRequired(true))
      .addStringOption(stringoption => stringoption
        .setName('new')
        .setDescription('de nieuwe naam die je de lijst wil geven.')
        .setRequired(true)))

    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Toon alle lijsten.')),

  async execute (interaction) {
    await defer(interaction)
    await reply(interaction, 'thinking...')

    switch (interaction.options.getSubcommand()) {
      case 'add':
        await addNewList(interaction)
        break
      case 'remove':
        await removeList(interaction)
        break
      case 'rename':
        await renameList(interaction)
        break
      case 'show':
        await showAllLists(interaction)
        break
    }
  }
}
