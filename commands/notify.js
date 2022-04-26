const { SlashCommandBuilder } = require('@discordjs/builders')
const { getGuild, saveGuild } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { verifyAdminAsync } = require('./admin')
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js')
const { DEFAULT_TIMEOUT } = require('../helpers/constants')

async function addNewList (interaction) {
  if (!await verifyAdminAsync(interaction)) { return }

  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('name')

  // Check if list exists
  if (Object.keys(guild.notifyLists).includes(listName)) {
    await interaction.editReply(`De lijst '${listName}' bestaat al, ${foemp()}!`)
    return
  }

  // create list
  guild.notifyLists[listName] = []
  await saveGuild(guild)
  await interaction.editReply(`De lijst ${listName} is aangemaakt!`)
}

async function removeList (interaction) {
  if (!await verifyAdminAsync(interaction)) { return }

  const guild = await getGuild(interaction.guildId)
  let listName = interaction.options.getString('name')

  // if no argument was passed, request one
  if (!listName) {
    // check if there are any lists to remove
    if (Object.keys(guild.notifyLists).length === 0) {
      await interaction.editReply('Er zijn nog geen lijstjes gemaakt op deze server!')
      return
    }

    // Show the select menu, and keep a reference to the message
    const selectionMenu = buildListSelector(guild)
    await interaction.editReply({ content: 'Selecteer een lijst om te verwijderen.', components: [selectionMenu] })
    const msg = await interaction.fetchReply()

    // await and handle select menu choice
    interaction = await msg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, componentType: 'SELECT_MENU', time: DEFAULT_TIMEOUT })
    await interaction.deferUpdate()
    listName = interaction.values[0]

    // remove selection menu from reply
    interaction.editReply({ content: 'Verwerken...', components: [] })
  }

  // check if list exists
  if (!Object.keys(guild.notifyLists).includes(listName)) {
    await interaction.editReply(`De lijst ${listName} bestaat niet, ${foemp()}!`)
    return
  }

  delete guild.notifyLists[listName]
  await saveGuild(guild)
  await interaction.editReply(`De lijst ${listName} is verwijderd!`)
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
      await interaction.editReply('Er zijn nog geen lijstjes gemaakt op deze server!')
      return
    }

    if (!Object.keys(guild.notifyLists).includes(oldName)) {
      await interaction.editReply(`De lijst '${oldName}' bestaat niet, ${foemp()}!`)
      return
    }
  }

  // if no newName was passed, request one
  if (!newName) {
    await interaction.editReply(`Je hebt geen nieuwe naam opgegeven voor '${oldName}', ${foemp()}!`)
  }

  // update the lists
  guild.notifyLists[newName] = guild.notifyLists[oldName]
  delete guild.notifyLists[oldName]
  await saveGuild(guild)

  // send reply
  await interaction.editReply(`De lijst '${oldName}' heet nu '${newName}'.`)
}

async function showAllLists (interaction) {
  const guild = await getGuild(interaction.guildId)

  // Check for existence of lists
  if (Object.keys(guild.notifyLists).length === 0) {
    await interaction.editReply('Er zijn nog geen lijstjes gemaakt op deze server!')
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

  await interaction.editReply({ embeds: [embed] })
}

function buildListSelector (guild) {
  const options = []
  for (const list in guild.notifyLists) {
    options.push({
      label: list,
      value: list
    })
  }

  return new MessageActionRow()
    .addComponents(
      new MessageSelectMenu()
        .setCustomId('select')
        .setPlaceholder('Kies een lijst...')
        .addOptions(options)
    )
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
    await interaction.deferReply()

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
