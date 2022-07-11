
const cron = require('cron')
const log = require('../helpers/logger')
const { getAllGuilds } = require('../helpers/guildData')
const { Collection } = require('discord.js')

const tasks = {}
let _client

const limit = 100 // 100 is the discord API limit SADFACE.JPG

const twoWeeksInMilliSeconds = 14 * 24 * 60 * 60 * 1000

const checkIndividual = (message, maxAge) => {
  const maxAgeInMilliSeconds = maxAge * 60 * 60 * 1000
  return !message.pinned && message.createdAt < (new Date() - maxAgeInMilliSeconds)
}

const checkBulk = (message, maxAge) => {
  const maxAgeInMilliSeconds = maxAge * 60 * 60 * 1000
  return !message.pinned && message.createdAt > (new Date() - twoWeeksInMilliSeconds) && message.createdAt < (new Date() - maxAgeInMilliSeconds)
}

const checkNonBulk = (message, maxAge) => {
  const maxAgeInMilliSeconds = maxAge * 60 * 60 * 1000
  return !message.pinned && message.createdAt < (new Date() - twoWeeksInMilliSeconds) && message.createdAt < (new Date() - maxAgeInMilliSeconds)
}

const initPurgeChannelTasks = async (client) => {
  _client = client
  const guildsData = await getAllGuilds()
  guildsData.forEach(guildData => {
    Object.entries(guildData.purgers).forEach(([channelId, purger]) => {
      if (!tasks[channelId]) {
        addPurgerAndStartTask(purger)
      }
    })
  })
}

const removePurgeChannelTask = async channelId => {
  if (!tasks[channelId]) {
    return
  }
  tasks[channelId].stop()
  delete tasks[channelId]
  log.info(`stopped and removed Purge task on channel <#${channelId}>`)
}

const addPurgerAndStartTask = (purger) => {
  tasks[purger.channelId] = cron.job(
    purger.cronTime,
    async () => {
      try {
        const channelToPurge = await _client.channels.cache.find(channel => channel.id === purger.channelId)?.fetch()
        if (!channelToPurge) {
          log.warn(`Task Purge failed: channel <#${purger.channelId}> does not exist [${purger.description}]`)
          return
        }
        log.info(`Task Purge: channel ${channelToPurge.name} <#${purger.channelId}> [${purger.description}]`)

        let lastFetchedMessageId // can be undefined for first fetch
        let messagesToDeleteIndividually = new Collection()
        let countDeletedMessage = 0
        // first use bulkDelete to reduce API calls, but bulkDelete doesn't delete messages older than 2 weeks (discord API limit)
        while (true) {
          // get last messages, starting at our last fetched message, or undefined if it's the first time we run this
          const fetchedMessages = await channelToPurge.messages.fetch({ limit, before: lastFetchedMessageId })

          // if there are no fetched messages, stop
          if (fetchedMessages.size === 0) {
            break
          }
          lastFetchedMessageId = fetchedMessages.last().id

          // filter for bulk removal
          const messagesToBulkDelete = fetchedMessages.filter(message => checkBulk(message, purger.maxAge))

          // add non bulk removable message to messagesToDelete
          messagesToDeleteIndividually = messagesToDeleteIndividually.concat(fetchedMessages.filter(message => checkNonBulk(message, purger.maxAge)))

          // actually delete them
          const deletedMessages = await channelToPurge.bulkDelete(messagesToBulkDelete)

          // if bulkDelete didn't delete any, we can stop this loop and move on to the indivitual delete loop
          if (messagesToDeleteIndividually.size > 0) {
            break
          }
          countDeletedMessage += deletedMessages.size
        }

        // if we still have messages that are older than 2 weeks, we need to use the individual delete, (sadly, these get capped at 5 calls per 5 seconds or so, yikes)
        if (messagesToDeleteIndividually.size === 0) {
          log.info(`Purge "${purger.description}" complete, deleted ${countDeletedMessage} messages of channel ${channelToPurge.name} <#${purger.channelId}>`)
          return
        }

        while (true) {
          // get last messages, starting at our last fetched message
          const fetchedMessages = await channelToPurge.messages.fetch({ limit, before: lastFetchedMessageId })

          // if there are none, break the while loop (we have completed fetching)
          if (fetchedMessages.size === 0) {
            break
          }

          lastFetchedMessageId = fetchedMessages.last().id
          const newMessagesToDelete = fetchedMessages.filter(message => checkIndividual(message, purger.maxAge))

          if (newMessagesToDelete.size > 0) {
            // if there are, add to the ToDelete list
            messagesToDeleteIndividually = messagesToDeleteIndividually.concat(newMessagesToDelete)
          }
        }

        // actually delete them
        const deleteMessagePromises = messagesToDeleteIndividually.map(async message => {
          await channelToPurge.messages.delete(message)
          countDeletedMessage++
        })
        const results = await Promise.allSettled(deleteMessagePromises)
        if (results.includes('rejected')) {
          log.warn(`Something went wrong purging all messages of channel ${channelToPurge.name} <#${purger.channelId}>`)
        }

        log.info(`Purge "${purger.description}" complete, deleted ${countDeletedMessage} messages of channel ${channelToPurge.name} <#${purger.channelId}>`)
      } catch (error) {
        log.error(`error executing Purger  "${purger.description}" to channel  <#${purger.channelId}>: ${error}`)
      }
    },
    undefined, // onComplete
    true // start
  )
  log.info(`added new Purge task to channel <#${purger.channelId}>: "${purger.description}" - max ${purger.maxAge} uur - cronTime: ${purger.cronTime}`)
}

// stop and start all PurgeChannelTasks not used atm, but could be useful eventually
const stopAllPurgeChannelTasks = () => {
  Object.values(tasks).forEach(task => task.stop())
}
const startAllPurgeChannelTasks = () => {
  Object.values(tasks).forEach(task => task.stop())
}

module.exports = { initPurgeChannelTasks, startAllPurgeChannelTasks, stopAllPurgeChannelTasks, addPurgerAndStartTask, removePurgeChannelTask }
