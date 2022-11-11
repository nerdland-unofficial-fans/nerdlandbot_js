const { initPurgeChannelTasksAsync, stopAllPurgeChannelTasks } = require('./purgeChannel')
const { startReminderTask, stopReminderTask } = require('./sendReminder')
const log = require('../helpers/logger')

async function startTasksAsync (client) {
  try {
    await initPurgeChannelTasksAsync(client)
    await startReminderTask(client)
    log.info('Started all tasks')
  } catch (e) {
    log.error(`Starting tasks failed: ${e}`)
  }
}

// stopTasks not used atm, but could be useful eventually
function stopTasks () {
  stopAllPurgeChannelTasks()
  stopReminderTask()
  log.info('Stopped all tasks')
}

module.exports = { startTasksAsync, stopTasks }
