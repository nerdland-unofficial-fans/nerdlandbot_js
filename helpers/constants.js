module.exports = {
  GUILD_DATA: './guilds',
  DEFAULT_TIMEOUT: 30000,
  EMBED_MAX_FIELD_LENGTH: 1024,
  DISCORD_MSG_MAX_LENGTH: 2000,
  DEFAULT_MEMBER_NOTIFICATION_NUMBER: 100,
  PURGER_LIMITS: {
    API_FETCH_LIMIT: 100, // 100 is the discord API limit SADFACE.JPG
    BULK_DELETE_MAX_AGE: 14 * 24 * 60 * 60 * 1000 // 2 weeks in milliseconds
  },
  CRON_REGEX_SYNTAX: /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5}/,
  // Cron for every friday at noon
  FREE_GAMES_CRON: '0 19 * * 5',
  FREE_GAMES_URL:
    'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?country=BE'
}
