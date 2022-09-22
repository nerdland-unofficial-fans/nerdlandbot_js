const { SlashCommandBuilder } = require('@discordjs/builders')
const { getGuild, saveGuild } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { reply, defer, sendToChannel } = require('../helpers/interactionHelper')
const { verifyAdminAsync } = require('./admin')
const { MessageEmbed } = require('discord.js')
const { EMBED_MAX_FIELD_LENGTH, DISCORD_MSG_MAX_LENGTH } = require('../helpers/constants')
const { getUserNameFromIdAsync, getTagFromId } = require('../helpers/userHelper')

async function addNewList (interaction) {
  // Verify permissions
  if (!await verifyAdminAsync(interaction)) { return }

  // Parse arguments from command
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('naam')

  // Check if list exists
  if (Object.keys(guild.notifyLists).map(notifyList => notifyList.toLowerCase()).includes(listName.toLowerCase())) {
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
  if (!await verifyAdminAsync(interaction)) { return }

  // Parse command arguments
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('naam')

  // check if list exists
  if (!Object.keys(guild.notifyLists).includes(listName)) {
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
  if (!await verifyAdminAsync(interaction)) { return }

  // parse command arguments
  const guild = await getGuild(interaction.guildId)
  const oldName = interaction.options.getString('naam')
  const newName = interaction.options.getString('nieuwe_naam')

  // error if old name was not valid
  if (!Object.keys(guild.notifyLists).includes(oldName)) {
    await reply(interaction, `De lijst ${oldName} bestaat niet, ${foemp(interaction)}!`)
    return
  }

  // error if no new name was supplied
  if (!newName) {
    await reply(interaction, `Je hebt geen nieuwe naam meegegeven, ${foemp(interaction)}!`)
    return
  }

  // error if the new name already exists
  if (Object.keys(guild.notifyLists).includes(newName)) {
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

  // send reply
  await reply(interaction, { content: ' ', embeds: [embed] })
}

async function subList (interaction) {
  // parse command arguments
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('naam')
  const userId = interaction.member.user.id

  // check if list exists
  if (!Object.keys(guild.notifyLists).includes(listName)) {
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

  // check if list exists
  if (!Object.keys(guild.notifyLists).includes(listName)) {
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
  const userId = interaction.member.user.id
  const listName = interaction.options.getString('naam')
  const message = interaction.options.getString('bericht')

  // check if list exists
  if (!Object.keys(guild.notifyLists).includes(listName)) {
    await reply(interaction, `De lijst ${listName} bestaat niet, ${foemp()}!`)
    return
  }

  // check wheter or not message is too long
  if (message && message.length > EMBED_MAX_FIELD_LENGTH) {
    await reply(interaction, `Je bericht is ${message.length - EMBED_MAX_FIELD_LENGTH} karakters te lang, ${foemp()}`)
    return
  }

  // check to see if the list has any subscribers to notify
  const subscribers = guild.notifyLists[listName]
  if (subscribers.length === 0) {
    await reply(interaction, `Er is nog niemand ingeschreven op deze lijst, ${foemp()}!`)
    return
  }

  // build notification
  const botName = await getUserNameFromIdAsync(interaction, interaction.applicationId)
  const username = getTagFromId(userId)
  const tags = []
  let tag = ''
  const connection = ', '
  for (const id of subscribers) {
    const usr = getTagFromId(id)

    if (tag.length + connection.length + usr.length < DISCORD_MSG_MAX_LENGTH) {
      if (tag.length > 0) {
        tag += connection
      }
      tag += usr
    } else {
      tags.push(tag)
      tag = ''
    }
  }
  if (tag.length > 0) {
    tags.push(tag)
  }

  // build reply
  const embed = new MessageEmbed()
  embed.setTitle(listName)
  embed.setDescription(`Ahem, Dit is ${botName} vanuit de montagekamer, willen de volgende personen zich op vraag van ${username} melden voor ${listName} a.u.b.`)
  if (message) {
    embed.addField('Bericht:', message)
  }

  // send reply
  await reply(interaction, { content: ' ', embeds: [embed], components: [] })
  // push tags to channel
  for (const content of tags) {
    await sendToChannel(interaction, content)
  }
}

async function addAutocompleteOptions (interaction) {
  // fetch subcommand to autocomplete for
  const subcommand = interaction.options.data.find(o => o.type === 'SUB_COMMAND')?.name
  if (!subcommand) {
    return
  }

  // get option to autocomplete
  const focusedOption = interaction.options.getFocused(true)
  const optionName = focusedOption.name
  const optionValue = focusedOption.value

  // Build options for option 'naam'
  if (optionName === 'naam') {
    const userId = interaction.member.user.id
    const guild = await getGuild(interaction.guildId)
    const lists = guild.notifyLists

    let filter
    if (subcommand === 'sub') {
      filter = (name, subscribers) => (!optionValue || name.includes(optionValue)) && !subscribers.includes(userId)
    } else if (subcommand === 'unsub') {
      filter = (name, subscribers) => (!optionValue || name.includes(optionValue)) && subscribers.includes(userId)
    } else {
      filter = (name, _) => !optionValue || name.includes(optionValue)
    }

    const options = []
    if (Object.keys(lists).length > 0) {
      for (const [name, subscribers] of Object.entries(lists)) {
        if (filter(name, subscribers)) {
          options.push(({ name: name, value: name }))
        }
      }
    }

    await interaction.respond(options, null)
  }
}

module.exports = {
  addAutocompleteOptions: addAutocompleteOptions,
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
        .setDescription('De naam van de lijst waarvoor je een notificatie wilt sture.')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(stringoption => stringoption
        .setName('bericht')
        .setDescription('Het bericht dat je aan je notificatie wilt toevoegen')
        .setRequired(false))),

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
    }
  }
}
