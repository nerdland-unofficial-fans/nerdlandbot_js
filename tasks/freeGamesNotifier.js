const cron = require('cron')
const axios = require('axios')
const {
  DateTimeFormatter,
  LocalDate,
  ZonedDateTime
} = require('@js-joda/core')

const formatter = DateTimeFormatter.ofPattern('M/d/yyyy')
const { getAllGuilds } = require('../helpers/guildData')
const log = require('../helpers/logger')
const { FREE_GAMES_CRON, FREE_GAMES_URL } = require('../helpers/constants')
const { discordTime } = require('../helpers/DateTimeHelper.js')

const tasks = {}
let _client

async function initFreeGamesTasksAsync (client) {
  _client = client
  const guildsData = await getAllGuilds()
  guildsData.forEach((guildData) => {
    if (guildData.freeGamesChecker) {
      addFreeGamesNotifierAndStartTask(guildData.freeGamesChecker)
    }
  })
}

async function checkGames (channelId) {
  const channel = await _client.channels.cache
    .find((channel) => channel.id === channelId)
    ?.fetch()

  // Get list of free games from Epic Games Store
  const allGames = (await axios.get(FREE_GAMES_URL))?.data?.data?.Catalog
    ?.searchStore?.elements

  if (!allGames) {
    log.error('Error getting free games list from Epic Games Store')
    return
  }

  const games = allGames.reduce(
    (acc, currentGame) => {
      const { title, promotions, price } = currentGame
      const now = discordTime()

      let startDate =
        promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0].startDate
      let endDate =
        promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0].endDate
      let upcomingStartDate =
        promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers?.[0]
          .startDate

      if (startDate) {
        startDate = ZonedDateTime.parse(startDate)
        endDate = ZonedDateTime.parse(endDate)
        const isFree = price?.totalPrice?.discountPrice === 0
        if (isFree && startDate.isBefore(now) && endDate.isAfter(now)) {
          // channel.send(`Free game alert! ${title} is free!`);
          acc.currentGames.push(title)
          return acc
        }
      }
      if (upcomingStartDate) {
        upcomingStartDate = ZonedDateTime.parse(upcomingStartDate)

        if (upcomingStartDate.isAfter(now)) {
          acc.upcomingGames.push(title)
          return acc
        }
      }

      return acc
    },
    { currentGames: [], upcomingGames: [] }
  )

  console.log(result, null, 2)

  // allGames
  //   .forEach(async (game) => {
  //     channel.send(
  //       `**${game.title}** is gratis te downloaden op de Epic Games Store!`
  //     );
  //   });
}

async function addFreeGamesNotifierAndStartTask (channelId) {
  checkGames(channelId)
  cron.job(FREE_GAMES_CRON, () => checkGames(channelId), undefined, true)
  log.info(
    `added new FreeGamesNotifier task to channel <#${channelId}> with cronTime: ${FREE_GAMES_CRON}`
  )
}

async function removeFreeGamesNotifierTask () {}

function stopAllFreeGamesTasks () {}

module.exports = {
  initFreeGamesTasksAsync,
  stopAllFreeGamesTasks
}
