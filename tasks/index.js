const { initPurgeChannelTasks, stopAllPurgeChannelTasks } = require('./purgeChannel')
const log = require('../helpers/logger')

const startTasks = async client => {
  try {
    await initPurgeChannelTasks(client)
    log.info('Started all tasks')
  } catch (e) {
    log.error(`Starting tasks failed: ${e}`)
  }
}

// stopTasks not used atm, but could be useful eventually
const stopTasks = () => {
  stopAllPurgeChannelTasks()
  log.info('Stopped all tasks')
}

module.exports = { startTasks, stopTasks }
