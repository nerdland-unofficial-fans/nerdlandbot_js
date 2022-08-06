
const cron = require('cron')
const log = require('../helpers/logger')
const { getAllGuilds } = require('../helpers/guildData')
const { Collection } = require('discord.js')
const { PURGER_LIMITS } = require('../helpers/constants')

const tasks = {}
let _client

const limit = PURGER_LIMITS.API_FETCH_LIMIT
const BulkDeleteMaxAge = PURGER_LIMITS.BULK_DELETE_MAX_AGE

function shouldDeleteMessage (message, maxAge) {
  const maxAgeInMilliSeconds = maxAge * 60 * 60 * 1000
  return !message.pinned &&
    message.createdAt < (new Date() - maxAgeInMilliSeconds)
}

function canDeleteInBulk (message, maxAge) {
  const maxAgeInMilliSeconds = maxAge * 60 * 60 * 1000
  return !message.pinned &&
    message.createdAt > (new Date() - BulkDeleteMaxAge) &&
    message.createdAt < (new Date() - maxAgeInMilliSeconds)
}

function shouldDeleteIndividually (message, maxAge) {
  const maxAgeInMilliSeconds = maxAge * 60 * 60 * 1000
  return !message.pinned &&
    message.createdAt < (new Date() - BulkDeleteMaxAge) &&
    message.createdAt < (new Date() - maxAgeInMilliSeconds)
}

async function initPurgeChannelTasksAsync (client) {
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

function removePurgeChannelTask (purger) {
  if (!tasks[purger.channelId]) {
    return
  }
  tasks[purger.channelId].stop()
  delete tasks[purger.channelId]
  log.info(`stopped and removed Purge task on channel <#${purger.channelId}>. Its settings were: max ${purger.maxAge} hours - cronTime: ${purger.cronTime}`)
}

function addPurgerAndStartTask (purger) {
  tasks[purger.channelId] = cron.job(
    purger.cronTime,
    async function () {
      try {
        const channelToPurge = await _client.channels.cache.find(channel => channel.id === purger.channelId)?.fetch()
        if (!channelToPurge) {
          log.warn(`Task Purge failed: channel <#${purger.channelId}> does not exist`)
          return
        }
        log.info(`Task Purge: channel ${channelToPurge.name} <#${purger.channelId}>`)

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
          const messagesToBulkDelete = fetchedMessages.filter(message => canDeleteInBulk(message, purger.maxAge))

          // add non bulk removable message to messagesToDelete
          messagesToDeleteIndividually = messagesToDeleteIndividually.concat(fetchedMessages.filter(message => shouldDeleteIndividually(message, purger.maxAge)))

          // actually delete them
          const deletedMessages = await channelToPurge.bulkDelete(messagesToBulkDelete)

          countDeletedMessage += deletedMessages.size

          // if any messages were filtered for individual deletion, we can stop this loop and move on to the individual deletion loop
          if (messagesToDeleteIndividually.size > 0) {
            break
          }
        }

        // if we still have messages that are older than 2 weeks, we need to use the individual delete, (sadly, these get capped at 5 calls per 5 seconds or so, yikes)
        if (messagesToDeleteIndividually.size === 0) {
          log.info(`Purge complete, deleted ${countDeletedMessage} messages of channel ${channelToPurge.name} <#${purger.channelId}>`)
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
          const newMessagesToDelete = fetchedMessages.filter(message => shouldDeleteMessage(message, purger.maxAge))

          if (newMessagesToDelete.size > 0) {
            // if there are, add to the ToDelete list
            messagesToDeleteIndividually = messagesToDeleteIndividually.concat(newMessagesToDelete)
          }
        }

        // done fetching all messages, now actually delete them individually
        const deleteMessagePromises = messagesToDeleteIndividually.map(async message => {
          await channelToPurge.messages.delete(message)
          countDeletedMessage++
        })
        const results = await Promise.allSettled(deleteMessagePromises)
        if (results.includes('rejected')) {
          log.warn(`Something went wrong purging all messages of channel ${channelToPurge.name} <#${purger.channelId}>`)
        }

        log.info(`Purge complete, deleted ${countDeletedMessage} messages of channel ${channelToPurge.name} <#${purger.channelId}>`)
      } catch (error) {
        log.error(`error executing Purger to channel <#${purger.channelId}>: ${error}`)
      }
    },
    undefined, // onComplete
    true // start
  )
  log.info(`added new Purge task to channel <#${purger.channelId}>: max ${purger.maxAge} hours - cronTime: ${purger.cronTime}`)
}

// stop and start all PurgeChannelTasks not used atm, but could be useful eventually
function stopAllPurgeChannelTasks () {
  Object.values(tasks).forEach(task => task.stop())
}
function startAllPurgeChannelTasks () {
  Object.values(tasks).forEach(task => task.stop())
}

module.exports = { initPurgeChannelTasksAsync, startAllPurgeChannelTasks, stopAllPurgeChannelTasks, addPurgerAndStartTask, removePurgeChannelTask }
