const cron = require('cron')
const axios = require('axios')
const { ZonedDateTime } = require('@js-joda/core')
const { EmbedBuilder } = require('discord.js')
const { getAllGuilds } = require('../helpers/guildData')
const log = require('../helpers/logger')
const {
  FREE_GAMES_CRON,
  EPIC_GAMES_API_URL,
  EPIC_GAMES_STORE_BASE_URL
} = require('../helpers/constants')
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
  const allGames = (await axios.get(EPIC_GAMES_API_URL))?.data?.data?.Catalog
    ?.searchStore?.elements

  if (!allGames) {
    log.error('Error getting free games list from Epic Games Store')
    return
  }

  const games = allGames.reduce(
    (acc, currentGame) => {
      const { title, description, promotions, price, keyImages } = currentGame
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
          const pageSlug = currentGame.catalogNs.mappings?.[0]?.pageSlug
          const url = EPIC_GAMES_STORE_BASE_URL + pageSlug
          const thumbnail =
            keyImages.find((image) => image.type === 'Thumbnail')?.url ||
            keyImages[0].url
          acc.currentGames.push({ title, url, description, thumbnail })
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

  const embeds = games.currentGames.map(
    ({ title, description, url, thumbnail }) => {
      const embed = new EmbedBuilder()
      embed
        .setTitle(title)
        .setURL(url)
        .setDescription(description)
        .setThumbnail(thumbnail)
      return embed
    }
  )

  const upcomingGames = games.upcomingGames
    .map((title) => `**${title}**`)
    .join(' en ')

  const content = `Er zijn weer gratis games beschikbaar op de Epic Games Store!
Volgende week is het aan ${upcomingGames}`

  await channel.send({
    content,
    embeds
  })
}

async function addFreeGamesNotifierAndStartTask (channelId) {
  cron.job(FREE_GAMES_CRON, () => checkGames(channelId), undefined, true)
  log.info(
    `added new FreeGamesNotifier task to channel <#${channelId}> with cronTime: ${FREE_GAMES_CRON}`
  )
}

async function removeFreeGamesNotifierTask () {}

function stopAllFreeGamesTasks () {
  // TODO: remove
  console.log(tasks)
}

module.exports = {
  initFreeGamesTasksAsync,
  stopAllFreeGamesTasks,
  removeFreeGamesNotifierTask
}
