# nerdlandbot_js
This is a JS-based discord bot developed by the nerdland fan community.

# Roadmap
This bot was setup mostly as an experiment, and there is no clearly defined goal so far.
If you have any suggestions feel free to log an issue in this repository, any new ideas or challenges are much appreciated.

# Privacy policy.
This bot was developed with privacy as one of our core ideals.
Because of this we have formulated a few statements about the inner workings.

The bot will only listen to user commands. 
We will not parse any user messages, nor track any reactions, unless those made specifically to interact with the bot.
We will not track any user data, except for your user ID, as this is required to notify you.
We will not store any data about your messages, reactions, or other actions you take on discord.

The logs we keep are strictly for debugging purposes, and will not contain any personal info.


# Creating your own test bot
When trying out things, it's best to create your own bot and use that one to test your code. To create your test version of the nerdlandbot:
- Go to discord.com https://discord.com/login?redirect_to=%2Fdevelopers%2Fapplications and log in.
- Create a new application eg. "bob-testbot"
- Switch to the 'Bot' configuration (select 'Bot' on the left panel)
- Create a bot and give it a name "bob-testbot" for example
- Make sure you set both 'Presence intent' and 'Server members intent' under 'Privileged Gateway Intents'

# Get your bot invited to servers
To get your bot invited onto a server, you need to create an invitation URL.
- Go to your application (see creating your own test bot above)
- Copy the "client id" from your application (! NOT your bot token !)
- The URL to invite your bot to a server is: https://discord.com/api/oauth2/authorize?client_id=<APPLICATION_CLIENT_ID>&permissions=0&scope=bot%20applications.commands

When visiting that page, you'll see a list of servers you have administration rights for. If you have your own server, it will be listed here. 
If you want to test on the NerdlandBottest server, provide this URL in the #helpdesk channel and kindly ask somebody to accept your bot and create a test channel.
Alternatively, you will need to acquire a `DISCORD_TOKEN`. It is possible to obtain one with a developer account on Discord.

# Create your .env file
You need a file to keep your bot token safely. You'll do this by creating a file with name ".env" which must contain following lines:
In the .env file there should be:

- DISCORD_TOKEN = "bot token"
- PREFIX = "bot prefix"
- CLIENT_ID = "user id for the bot"
- GUILD_ID = "The id for your test-server"
- NOTIFICATION_CHANNEL_ID = "The id for a channel where periodic new member messages will be sent to"

Important note: The GUILD_ID limits your instance of the bot to your server, but makes sure commands are updated instantly instead of using discords hourly cache. This property should be omitted for production builds!

# Running the bot
- npm install
- node nerdlandbot.js

# Code Style
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

This project uses JavaScript Standard Style.
In order to make sure your code is compliant before comitting you can run the following commands

```
// if standard is not yet installed, run this first
npm i -g standard

// run the code analysis
npm test

// if the analysis finds issues, most can be solved automatically
standard --fix
```

The analysis is run automatically for each branch on the origin, and for each pull request to 'main' or 'develop'.

Failing the standardjs analysis will prevent a branch from being merged.



# Links
* [Nerdland website](https://nerdland.be)
* [Nerdland merch](https://www.mistert.be/nerdland)
