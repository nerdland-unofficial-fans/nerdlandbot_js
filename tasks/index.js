const { initPurgeChannelTasksAsync, stopAllPurgeChannelTasks } = require('./purgeChannel')
const log = require('../helpers/logger')

async function startTasksAsync (client) {
  try {
    await initPurgeChannelTasksAsync(client)
    log.info('Started all tasks')
  } catch (e) {
    log.error(`Starting tasks failed: ${e}`)
  }
}

// stopTasks not used atm, but could be useful eventually
function stopTasks () {
  stopAllPurgeChannelTasks()
  log.info('Stopped all tasks')
}

module.exports = { startTasksAsync, stopTasks }
