module.exports = {
  GUILD_DATA: './guilds',
  DEFAULT_TIMEOUT: 30000,
  EMBED_MAX_FIELD_LENGTH: 1024,
  DISCORD_MSG_MAX_LENGTH: 2000,
  DEFAULT_MEMBER_NOTIFICATION_NUMBER: 100,
  AUTOCOMPLETE_MAX_RESULTS: 25,
  PURGER_LIMITS: {
    API_FETCH_LIMIT: 100, // 100 is the discord API limit SADFACE.JPG
    BULK_DELETE_MAX_AGE: 14 * 24 * 60 * 60 * 1000 // 2 weeks in milliseconds
  },
  CRON_REGEX_SYNTAX: /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5}/,
  REMINDER_CRON_TIME: '* * * * *', // every minute
  // Cron for every friday at noon
  FREE_GAMES_CRON: '0 19 * * 5',
  MODAL_IDS: {
    REMINDER_MODAL: 'reminderModal'
  },
  EPIC_GAMES_API_URL:
    'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?country=BE',
  EPIC_GAMES_STORE_BASE_URL: 'https://www.epicgames.com/store/en-US/p/',
  DAD_JOKE_URL: 'https://icanhazdadjoke.com',
  WOMBATS_DIR_NAME: 'wombats'
}
