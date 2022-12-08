const { SlashCommandBuilder } = require('@discordjs/builders')
const { getGuild, saveGuild, verifyAdmin } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { reply, defer, sendToChannel } = require('../helpers/interactionHelper')
const { EmbedBuilder } = require('discord.js')
const { getUserNameFromIdAsync, getTagFromId } = require('../helpers/userHelper')
const { getNotifyTags } = require('../helpers/getNotifyTags')
const { caseInsensitiveSort } = require('../helpers/sortHelper')
const { arrayIncludesString } = require('../helpers/arrayHelper')
const { EMBED_MAX_FIELD_LENGTH } = require('../helpers/constants')

async function addNewList (interaction) {
  // Verify permissions
  if (!await verifyAdmin(interaction)) { return }

  // Parse arguments from command
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('naam')
  const listNames = Object.keys(guild.notifyLists)

  // Check if list exists
  if (arrayIncludesString(listNames, listName, false)) {
    await reply(interaction, `De lijst '${listName}' bestaat al, ${foemp(interaction)}!`)
    return
  }

  // create list
  guild.notifyLists[listName] = []
  await saveGuild(guild)

  // send user reply
  await reply(interaction, `De lijst ${listName} is aangemaakt!`)
}

async function removeList (interaction) {
  // Verify permissions
  if (!await verifyAdmin(interaction)) { return }

  // Parse command arguments
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('naam')
  const listNames = Object.keys(guild.notifyLists)

  // check if list exists
  if (!arrayIncludesString(listNames, listName, false)) {
    await reply(interaction, `De lijst ${listName} bestaat niet, ${foemp(interaction)}!`)
    return
  }

  // delete the list
  delete guild.notifyLists[listName]
  await saveGuild(guild)

  // send user reply
  await reply(interaction, `De lijst ${listName} is verwijderd!`)
}

async function renameList (interaction) {
  // verify permissions
  if (!await verifyAdmin(interaction)) { return }

  // parse command arguments
  const guild = await getGuild(interaction.guildId)
  const oldName = interaction.options.getString('naam')
  const newName = interaction.options.getString('nieuwe_naam')
  const listNames = Object.keys(guild.notifyLists)

  // error if old name was not valid
  if (!arrayIncludesString(listNames, oldName, false)) {
    await reply(interaction, `De lijst ${oldName} bestaat niet, ${foemp(interaction)}!`)
    return
  }

  // error if no new name was supplied
  if (!newName) {
    await reply(interaction, `Je hebt geen nieuwe naam meegegeven, ${foemp(interaction)}!`)
    return
  }

  // error if the new name already exists
  if (arrayIncludesString(listNames, newName, false)) {
    await reply(interaction, `De lijst ${newName} bestaat al, ${foemp(interaction)}!`)
    return
  }

  // update the lists
  guild.notifyLists[newName] = guild.notifyLists[oldName]
  delete guild.notifyLists[oldName]
  await saveGuild(guild)

  // send reply
  await reply(interaction, `De lijst '${oldName}' heet nu '${newName}'.`)
}

async function showAllLists (interaction) {
  // get guild
  const guild = await getGuild(interaction.guildId)
  const listNames = Object.keys(guild.notifyLists)

  // Check for existence of lists
  if (listNames.length === 0) {
    await reply(interaction, 'Er zijn nog geen lijstjes gemaakt op deze server!')
    return
  }

  // build reply
  const desc = listNames
    .sort(caseInsensitiveSort)
    .map(list => `\u2022 ${list}`)
    .join('\n')

  const embed = new EmbedBuilder()
    .setTitle('Lijstjes')
    .setDescription(desc)

  // send reply
  await reply(interaction, { content: ' ', embeds: [embed] })
}

async function subList (interaction) {
  // parse command arguments
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('naam')
  const userId = interaction.member.user.id
  const listNames = Object.keys(guild.notifyLists)

  // check if list exists
  if (!arrayIncludesString(listNames, listName, false)) {
    await reply(interaction, `De lijst ${listName} bestaat niet, ${foemp()}!`)
    return
  }

  // check if user is already subscribed to list
  if (guild.notifyLists[listName].includes(userId)) {
    await reply(interaction, `Je ontvangt al notificaties voor ${listName}, ${foemp()}!`)
    return
  }

  // subscribe list
  guild.notifyLists[listName].push(userId)
  await saveGuild(guild)

  // reply to user
  await reply(interaction, `Je ontvangt nu notificaties voor de lijst ${listName}`)
}

async function unsubList (interaction) {
  // parse command arguments
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('naam')
  const userId = interaction.member.user.id
  const listNames = Object.keys(guild.notifyLists)

  // check if list exists
  if (!arrayIncludesString(listNames, listName, false)) {
    await reply(interaction, `De lijst ${listName} bestaat niet, ${foemp()}!`)
    return
  }

  // check if user is actually subscribed to list
  if (!guild.notifyLists[listName].includes(userId)) {
    await reply(interaction, `Je ontvangt geen notificaties voor ${listName}, ${foemp()}!`)
    return
  }

  // subscribe list
  const index = guild.notifyLists[listName].indexOf(userId)
  guild.notifyLists[listName].splice(index, 1)
  await saveGuild(guild)

  // reply to user
  await reply(interaction, `Je ontvangt niet langer notificaties voor de lijst ${listName}`)
}

async function notifyList (interaction) {
  const guild = await getGuild(interaction.guildId)
  const { notifyLists } = guild
  const userId = interaction.member.user.id
  const listName = interaction.options.getString('naam')
  const message = interaction.options.getString('bericht')

  let tags
  try {
    tags = getNotifyTags(notifyLists, listName)
  } catch (error) {
    await reply(interaction, error.message)
  }

  // check wheter or not message is too long
  if (message && message.length > EMBED_MAX_FIELD_LENGTH) {
    throw new Error(`Je bericht is ${message.length - EMBED_MAX_FIELD_LENGTH} karakters te lang, ${foemp()}`)
  }

  const botName = await getUserNameFromIdAsync(interaction, interaction.applicationId)
  const username = getTagFromId(userId)

  // build reply
  const embed = new EmbedBuilder()
  embed.setTitle(listName)
  embed.setDescription(`Ahem, Dit is ${botName} vanuit de montagekamer, willen de volgende personen zich op vraag van ${username} melden voor ${listName} a.u.b.`)
  if (message) {
    embed.addFields([{ name: 'Bericht:', value: message }])
  }

  // send reply
  await reply(interaction, { content: ' ', embeds: [embed], components: [] })
  // push tags to channel
  for (const content of tags) {
    await sendToChannel(interaction, content)
  }
}

async function showSubscriptions (interaction) {
  const guild = await getGuild(interaction.guildId)
  const userId = interaction.member.user.id
  const allLists = Object.entries(guild.notifyLists)
  if (allLists.length === 0) {
    await reply(interaction, 'Er zijn nog geen lijstjes gemaakt op deze server!')
    return
  }

  // filter subscribed lists
  const subscriptions = allLists
    .filter(arr => arr[1].includes(userId))
    .map(arr => arr[0])
    .sort(caseInsensitiveSort)
  if (subscriptions.length === 0) {
    await reply(interaction, 'Je bent op geen enkele lijst ingeschreven!')
    return
  }

  // build reply
  const embed = new EmbedBuilder()
    .setTitle('Jouw subscriptions:')
    .setDescription(subscriptions.map(list => `\u2022 ${list}`).join('\n'))

  // send reply
  await reply(interaction, { content: ' ', embeds: [embed] })
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('lijst functionaliteit.')

    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Voeg een nieuwe lijst toe.')
      .addStringOption(stringoption => stringoption
        .setName('naam')
        .setDescription('De naam van de lijst om toe te voegen.')
        .setRequired(true)))

    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Verwijder een bestaande lijst.')
      .addStringOption(stringoption => stringoption
        .setName('naam')
        .setDescription('De naam van de lijst om te verwijderen.')
        .setRequired(true)
        .setAutocomplete(true)))

    .addSubcommand(subcommand => subcommand
      .setName('rename')
      .setDescription('de naam van een lijst wijzigen.')
      .addStringOption(stringoption => stringoption
        .setName('naam')
        .setDescription('de lijst die je wenst te hernoemen.')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(stringoption => stringoption
        .setName('nieuwe_naam')
        .setDescription('de nieuwe naam die je de lijst wil geven.')
        .setRequired(true)))

    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Toon alle lijsten.'))

    .addSubcommand(subcommand => subcommand
      .setName('sub')
      .setDescription('Ontvang notificaties voor een lijst.')
      .addStringOption(stringoption => stringoption
        .setName('naam')
        .setDescription('De naam van de lijst om notificaties van te ontvangen')
        .setRequired(true)
        .setAutocomplete(true)))

    .addSubcommand(subcommand => subcommand
      .setName('unsub')
      .setDescription('Ontvang niet langer notificaties voor een lijst')
      .addStringOption(stringoption => stringoption
        .setName('naam')
        .setDescription('De naam van de lijst om niet langer notificaties van te ontvangen')
        .setRequired(true)
        .setAutocomplete(true)))

    .addSubcommand(subcommand => subcommand
      .setName('notify')
      .setDescription('Stuur een notificatie naar iedereen op een bepaalde lijst')
      .addStringOption(stringoption => stringoption
        .setName('naam')
        .setDescription('De naam van de lijst waarvoor je een notificatie wilt sturen.')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(stringoption => stringoption
        .setName('bericht')
        .setDescription('Het bericht dat je aan je notificatie wilt toevoegen')
        .setRequired(false)))

    .addSubcommand(subcommand => subcommand
      .setName('subscriptions')
      .setDescription('Toon alle lijsten waar je op geabbonneerd bent')),

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
      case 'sub':
        await subList(interaction)
        break
      case 'unsub':
        await unsubList(interaction)
        break
      case 'notify':
        await notifyList(interaction)
        break
      case 'subscriptions':
        await showSubscriptions(interaction)
        break
    }
  }
}
