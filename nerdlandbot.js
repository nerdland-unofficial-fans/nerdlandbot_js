// Import relevant classes from discord.js
const { Client, GatewayIntentBits, Collection, Events, MessageFlags, REST, Routes } = require('discord.js')
// Import commands
// Import helpers
const log = require('./helpers/logger')
const { foemp } = require('./helpers/foemp')
const { startTasksAsync } = require('./tasks')
const { onMemberJoinAsync } = require('./eventHandlers/onMemberJoin')
const { onBanTrapMessageAsync } = require('./eventHandlers/onBanTrapMessage')
const { getAllCommandsSync } = require('./helpers/metadataHelper')
const { addAutocompleteOptions } = require('./helpers/autoCompleteHelper')
const { modalHelper } = require('./helpers/modalHelper')

// Setup our environment variables via dotenv
require('dotenv').config({ quiet: true })

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const GUILD_ID = process.env.GUILD_ID

if (!DISCORD_TOKEN) {
  const err = new Error('Failed to start bot! No DISCORD_TOKEN found in .env file.')
  log.error(err)
  throw err
}

if (CLIENT_ID) {
  log.info(`Start bot with client id '${CLIENT_ID}'.`)
} else {
  const err = new Error('Failed to start bot! No CLIENT_ID found in .env file.')
  log.error(err)
  throw err
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)

// Instantiate a new client with some necessary parameters.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ]
})
// Load commands
const commands = []
client.commands = new Collection()
const cmds = getAllCommandsSync()
for (const command of cmds) {
  commands.push(command.data.toJSON())
  client.commands.set(command.data.name, command)
}
// Register commands
(async function () {
  try {
    log.info('Started refreshing application (/) commands!')

    // if a GUILD ID for a test server is defined, we should use the applicationGuildCommands routes as it updates the commands instantly
    if (!GUILD_ID) {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      )
    } else {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      )
    }

    log.info('Successfully reloaded application (/) commands.')
  } catch (error) {
    log.error(error)
  }
})()

// Helper functions for handlers
async function executeCommand (interaction) {
  const command = client.commands.get(interaction.commandName)
  if (!command) {
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    log.error(error)
    const content = `Da kennek nie ${foemp(interaction)}!`
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content })
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral })
    }
  }
}

async function populateAutocomplete (interaction) {
  await addAutocompleteOptions(interaction)
}

async function handleModalSubmit (interaction) {
  await modalHelper(interaction)
}

// Notify progress
client.once(Events.ClientReady, readyClient => {
  log.info(`Logged in as ${readyClient.user.tag}!`)

  // start tasks
  startTasksAsync(client) // no need to await
})

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      await executeCommand(interaction)
    } else if (interaction.isAutocomplete()) {
      await populateAutocomplete(interaction)
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction)
    }
  } catch (error) {
    log.error(error)
    if (interaction.isAutocomplete() && !interaction.responded) {
      await interaction.respond([])
    }
  }
})

client.on(Events.GuildMemberAdd, async member => {
  try {
    await onMemberJoinAsync(member, client)
  } catch (error) {
    log.error(error)
  }
})

client.on(Events.MessageCreate, async message => {
  try {
    await onBanTrapMessageAsync(message)
  } catch (error) {
    log.error(error)
  }
})

// Authenticate
client.login(DISCORD_TOKEN)
