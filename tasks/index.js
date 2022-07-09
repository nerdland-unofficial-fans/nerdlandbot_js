const { startPurgeChannelTasks, stopPurgeChannelTasks } = require('./purgeChannel')
const log = require('../helpers/logger')

const startTasks = async client => {
  try {
    await startPurgeChannelTasks(client)
    log.info('Started all tasks')
  } catch (e) {
    log.error(`Starting tasks failed: ${e}`)
  }
}

const stopTasks = () => {
  stopPurgeChannelTasks()
  log.info('Stopped all tasks')
}

module.exports = { startTasks, stopTasks }
