const { SlashCommandBuilder } = require('@discordjs/builders')
const { getGuild, saveGuild } = require('../helpers/guildData')
const { foemp } = require('../helpers/foemp')
const { reply, defer, sendToChannel } = require('../helpers/interactionHelper')
const { verifyAdminAsync } = require('./admin')
const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js')
const { DEFAULT_TIMEOUT, BUTTON_STYLES, EMBED_MAX_FIELD_LENGTH, DISCORD_MSG_MAX_LENGTH } = require('../helpers/constants')
const { getUserNameFromIdAsync, getTagFromIdAsync } = require('../helpers/userHelper')

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

  await reply(interaction, { content: ' ', embeds: [embed] })
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

async function subList (interaction) {
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('name')
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
  const guild = await getGuild(interaction.guildId)
  const listName = interaction.options.getString('name')
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
  const listName = interaction.options.getString('name')
  const message = interaction.options.getString('message')

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

  const subscribers = guild.notifyLists[listName]

  // check if user is subscribed to the list
  if (!subscribers.includes(userId)) {
    const actionRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('notify')
          .setLabel('Notify!')
          .setStyle(BUTTON_STYLES.PRIMARY),
        new MessageButton()
          .setCustomId('sub')
          .setLabel('Schrijf me in!')
          .setStyle(BUTTON_STYLES.SUCCESS),
        new MessageButton()
          .setCustomId('cancel')
          .setLabel('Annuleren')
          .setStyle(BUTTON_STYLES.DANGER)
      )
    const confirmationMessage = await reply(interaction, { content: `Je bent zelf niet ingeschreven op de lijst '${listName}'. Wens je toch een notify te sturen? Of wil je enkel jezelf toevoegen?`, components: [actionRow] })
    interaction = await confirmationMessage.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, componentType: 'BUTTON', time: DEFAULT_TIMEOUT, ephemeral: true })

    // handle interaction
    await defer(interaction)
    if (interaction.customId === 'cancel') {
      interaction.deleteReply()
      return
    } else if (interaction.customId === 'sub') {
      guild.notifyLists[listName].push(userId)
      await reply(interaction, `Je ontvangt nu notificaties voor de lijst ${listName}`)
      return
    } else {
      // continue and notify for list
    }
  }

  if (subscribers.length === 0) {
    await reply(interaction, `Er is nog niemand ingeschreven op deze lijst, ${foemp()}!`)
    return
  }

  // notify list
  const botName = await getUserNameFromIdAsync(interaction, interaction.applicationId)
  const username = await getTagFromIdAsync(interaction, userId)
  const tags = []
  let tag = ''
  for (const id of subscribers) {
    const usr = await getTagFromIdAsync(interaction, id)

    if (usr.length + tag.length + 5 < DISCORD_MSG_MAX_LENGTH) {
      if (tag.length > 0) {
        tag += ', '
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

  await reply(interaction, { content: ' ', embeds: [embed], components: [] })
  for (const content of tags) {
    await sendToChannel(interaction, content)
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('lijst functionaliteit.')

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
      .setDescription('Toon alle lijsten.'))

    .addSubcommand(subcommand => subcommand
      .setName('sub')
      .setDescription('Ontvang notificaties voor een lijst.')
      .addStringOption(stringoption => stringoption
        .setName('name')
        .setDescription('De naam van de lijst om notificaties van te ontvangen')
        .setRequired(true)))

    .addSubcommand(subcommand => subcommand
      .setName('unsub')
      .setDescription('Ontvang niet langer notificaties voor een lijst')
      .addStringOption(stringoption => stringoption
        .setName('name')
        .setDescription('De naam van de lijst om niet langer notificaties van te ontvangen')
        .setRequired(true)))

    .addSubcommand(subcommand => subcommand
      .setName('notify')
      .setDescription('Stuur een notificatie naar iedereen op een bepaalde lijst')
      .addStringOption(stringoption => stringoption
        .setName('name')
        .setDescription('De naam van de lijst waarvoor je een notificatie wilt sture.'))
      .addStringOption(stringoption => stringoption
        .setName('message')
        .setDescription('Het bericht dat je aan je notificatie wilt toevoegen'))),

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
