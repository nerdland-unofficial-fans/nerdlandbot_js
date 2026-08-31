
const cron = require('cron')
const log = require('../helpers/logger')
const { getAllGuilds, saveGuild } = require('../helpers/guildData')
const { REMINDER_CRON_TIME } = require('../helpers/constants')
const { discordTime, formatEpochSeconds } = require('../helpers/DateTimeHelper')

async function startReminderTask (client) {
  const guildsData = await getAllGuilds()
  const reminderJob = new cron.CronJob(
    REMINDER_CRON_TIME,
    async function () {
      try {
        for (const guildData of guildsData) {
          const now = discordTime()
          for (const [reminderTime, reminder] of Object.entries(guildData.reminders)) {
            if (now.toEpochSecond() >= reminderTime) {
              const reminderMessage = `Hey <@${reminder.memberId}>, ik moest je om ${formatEpochSeconds(Number(reminderTime))} herinneren aan het volgende:\n${reminder.message}`
              if (guildData.reminderChannel !== '') {
                const channel = await client.channels.fetch(guildData.reminderChannel)
                await channel.send(reminderMessage)
              } else {
                const user = await client.users.fetch(reminder.memberId)
                await user.send(reminderMessage)
              }
              delete guildData.reminders[reminderTime]
              await saveGuild(guildData)
            }
          }
        }
      } catch (error) {
        log.error(`error sending reminder: ${error}`)
      }
    },
    undefined, // onComplete
    true // start
  )
  log.info(`Checking for new reminders every.. - cron ${REMINDER_CRON_TIME}`)
  return reminderJob
}

module.exports = { startReminderTask }
