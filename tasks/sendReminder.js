
const cron = require('cron')
const log = require('../helpers/logger')
const { getAllGuilds, saveGuild } = require('../helpers/guildData')
const { REMINDER_CRON_TIME } = require('../helpers/constants')
const { discordTime, reminderTime } = require('../helpers/DateTimeHelper')

async function startReminderTask (client) {
  const guildsData = await getAllGuilds()
  const reminderJob = cron.job(
    REMINDER_CRON_TIME,
    async function () {
      try {
        guildsData.forEach(guildData => {
          if (!guildData.reminderChannel) {
            log.info('No reminder channel set.')
            return
          }
          const channel = client.channels.cache.get(guildData.reminderChannel)
          const now = discordTime()
          Object.entries(guildData.reminders).forEach(([originalTime, reminder]) => {
            if (now.toEpochSecond() >= reminder.timeToBeReminded) {
              channel.send(`Hey <@${reminder.memberId}>, ik moest je om ${reminderTime(reminder.timeToBeReminded)} herinneren aan het volgende:\n${reminder.message}`)
              delete guildData.reminders[originalTime]
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
  log.info(`Checking for new reminders every minute - cron ${REMINDER_CRON_TIME}`)
}

module.exports = { startReminderTask }
