
// Import relevant classes from discord.js
const { Client, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
// Import commands
const { pingPrefix, pingSlash } = require('./commands/ping');


// Setup our environment variables via dotenv
require('dotenv').config()


let PREFIX = process.env.PREFIX;
let DISCORD_TOKEN = process.env.DISCORD_TOKEN;
let CLIENT_ID = process.env.CLIENT_ID;

if (PREFIX) {
    console.log("Start bot with prefix '" + PREFIX + "'")
}
else {
    throw new Error("Please provide a PREFIX in your .env file");
}

if (CLIENT_ID) {
    console.log("Start bot with client id '" + CLIENT_ID + "'")
}
else {
    throw new Error("Please provide a CLIENT_ID in your .env file");
}

const rest = new REST({ version: '9' }).setToken(DISCORD_TOKEN);

const commands = [{
  name: 'ping',
  description: 'Replies with Pong!'
}]; 


// Instantiate a new client with some necessary parameters.
const client = new Client(
    { intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }
);

(async () => {
	try {
		console.log(`Started refreshing application (/) commands!`);

		await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

// Notify progress
client.on('ready', function(e){
    console.log(`Logged in as ${client.user.tag}!`)
    
})



client.on('messageCreate', (message) => {
    if (message.author.bot) {
        return
    }
    else if ( message.content.startsWith(PREFIX) ) {
        let messageParts  = message.content.substring(PREFIX.length).split(" ");
        let command = messageParts[0].toLowerCase();
        processCommandPrefix(message,command)
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        return
    }
    let { commandName } = interaction;
    await processCommandSlash(interaction,commandName);
})


function processCommandPrefix(message,command) {
    switch (command) {
        case "ping":
            pingPrefix(message);
            break;
    }
}
async function processCommandSlash(interaction,commandName) {
    switch (commandName) {
        case "ping":
            await pingSlash(interaction);
            break;
    }
}
// Authenticate
client.login(process.env.DISCORD_TOKEN)
