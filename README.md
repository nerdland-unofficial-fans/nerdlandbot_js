# Nerdland Bot

JavaScript Discord bot developed by the Nerdland fan community.

## Features

- Slash commands and autocomplete
- Notification lists and subscriptions
- Reminders through a server channel or DM
- Scheduled channel cleanup
- Configurable ban-trap channels
- Epic Games Store free-game notifications
- Member counts and member milestone notifications
- Bot-admin and server settings
- Dad jokes, wombat pictures, privacy information, and project help

Use `/help` in Discord for the complete command list.

## Requirements

- Node.js 24 or newer
- npm
- A Discord application and bot token

## Create a test bot

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create an application and add a bot.
3. Open the bot settings and enable these privileged Gateway intents:
   - Presence Intent
   - Server Members Intent
4. Under OAuth2 → URL Generator, select these scopes:
   - `bot`
   - `applications.commands`
5. Select the permissions needed by the enabled features:
   - View Channels
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Manage Messages, when using the purger or ban trap
   - Ban Members, when using the ban trap
6. Open the generated URL and invite the bot to your test server.

## Configuration

Copy `.env.EXAMPLE` to `.env` and provide:

```ini
DISCORD_TOKEN="your bot token"
CLIENT_ID="your application ID"
GUILD_ID="your test server ID"
```

`GUILD_ID` is optional. Set it during development to register commands only in one server. Omit it to register commands globally.

Never commit `.env` or include it in a container image.

## Run locally

```sh
npm ci
node nerdlandbot.js
```

The bot stores guild configuration in `guilds/` and writes logs to `logs/`.

## Run with Docker

The image runs as user ID `1000`. Create writable persistent directories first:

```sh
mkdir -p guilds logs
sudo chown -R 1000:1000 guilds logs

docker run --name nerdlandbot \
  --restart unless-stopped \
  --env-file .env \
  -v "$(pwd)/guilds:/usr/src/app/guilds" \
  -v "$(pwd)/logs:/usr/src/app/logs" \
  ghcr.io/nerdland-unofficial-fans/nerdlandbot_js:main
```

Example Docker Compose configuration:

```yaml
services:
  nerdlandbot:
    image: ghcr.io/nerdland-unofficial-fans/nerdlandbot_js:main
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./guilds:/usr/src/app/guilds
      - ./logs:/usr/src/app/logs
```

## Development

Run linting and smoke tests:

```sh
npm test
```

Run only JavaScript Standard Style checks:

```sh
npm run lint
```

Automatically fix supported style issues:

```sh
npx standard --fix
```

Husky installs a pre-commit hook through `npm ci` and runs the test command before each commit. CI also runs tests for pushes and pull requests.

## Privacy

The bot does not request Discord's Message Content intent and does not inspect regular message contents. It processes slash commands, interactions, member events, presence information, and message metadata required by enabled features. When a ban trap is enabled, it reacts to messages based only on author and channel.

Guild configuration is stored locally as JSON. Depending on used features, this can include Discord user IDs, bot-admin IDs, notification subscriptions, channel IDs, schedules, and reminder text. Reminder text remains stored until the reminder is delivered. Logs contain technical and error information used for operation and debugging.

The bot does not track reactions or build profiles from normal Discord activity.

## Ban trap

Bot admins can configure a text channel where posting immediately deletes the triggering message and bans the author:

```text
/settings set_ban_trap channel:#channel delete_history_hours:24
```

`delete_history_hours` is optional, defaults to 24, and accepts 0–168 hours. Discord removes that member's recent message history across the server as part of the ban.

Server moderators, server administrators, and configured bot admins are exempt. Disable the feature with `/settings clear_ban_trap`.

## Contributing

Suggestions and contributions are welcome. Open an issue when proposing a change or when unsure where to begin.

## Links

- [Nerdland website](https://nerdland.be)
- [Nerdland merch](https://www.mistert.be/nerdland)
- [Project issues](https://github.com/nerdland-unofficial-fans/nerdlandbot_js/issues)
