
// Import relevant classes from discord.js
const fs = require('fs');
const { Client, Intents, Collection } = require('discord.js')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
// Import commands
const { pingPrefix } = require('./commands/ping')

// Setup our environment variables via dotenv
require('dotenv').config()

const PREFIX = process.env.PREFIX
const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.CLIENT_ID

if (PREFIX) {
  console.log("Start bot with prefix '" + PREFIX + "'")
} else {
  throw new Error('Please provide a PREFIX in your .env file')
}

if (CLIENT_ID) {
  console.log("Start bot with client id '" + CLIENT_ID + "'")
} else {
  throw new Error('Please provide a CLIENT_ID in your .env file')
}

const rest = new REST({ version: '9' }).setToken(DISCORD_TOKEN)

// Instantiate a new client with some necessary parameters.
const client = new Client(
  { intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }
);
// Load commands
const commands = [];
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command)
}
// Register commands
(async () => {
  try {
    console.log('Started refreshing application (/) commands!')

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    )

    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
})()

// Notify progress
client.on('ready', function (e) {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', (message) => {
  if (!message.author.bot && message.content.startsWith(PREFIX)) {
    const messageParts = message.content.substring(PREFIX.length).split(' ')
    const command = messageParts[0].toLowerCase()
    processCommand(message, command)
  }
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) {
    return
  }
  const { commandName } = interaction
  await processCommand(interaction, commandName)
})

async function processCommand (interaction, commandName) {
  // interaction can be an interaction and a message
  const command = client.commands.get(commandName);
  
	if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
}
// Authenticate
client.login(process.env.DISCORD_TOKEN)
