
const cron = require('cron')
const log = require('../helpers/logger')
const { getAllGuilds, saveGuild } = require('../helpers/guildData')
const { REMINDER_CRON_TIME } = require('../helpers/constants')
const { discordTime, formatEpochSeconds } = require('../helpers/DateTimeHelper')

async function startReminderTask (client) {
  const guildsData = await getAllGuilds()
  const reminderJob = cron.CronJob(
    REMINDER_CRON_TIME,
    async function () {
      try {
        guildsData.forEach(guildData => {
          const now = discordTime()
          Object.entries(guildData.reminders).forEach(([reminderTime, reminder]) => {
            if (now.toEpochSecond() >= reminderTime) {
              const reminderMessage = `Hey <@${reminder.memberId}>, ik moest je om ${formatEpochSeconds(Number(reminderTime))} herinneren aan het volgende:\n${reminder.message}`
              if (guildData.reminderChannel !== '') {
                const channel = client.channels.cache.get(guildData.reminderChannel)
                channel.send(reminderMessage)
              } else {
                client.users.send(reminder.memberId, reminderMessage)
              }
              delete guildData.reminders[reminderTime]
              saveGuild(guildData)
            }
          })
        })
      } catch (error) {
        log.error(`error sending reminder: ${error}`)
      }
    },
    undefined, // onComplete
    true // start
  )
  reminderJob.start()
  log.info(`Checking for new reminders every.. - cron ${REMINDER_CRON_TIME}`)
}

module.exports = { startReminderTask }
