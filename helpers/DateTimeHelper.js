const { ZoneId, Instant } = require('@js-joda/core')
require('@js-joda/timezone')

const timeZones = {
  BRUSSELS: ZoneId.of('Europe/Brussels')
}

function now (zone) {
  return Instant.now().atZone(zone)
}

function discordTime () {
  return now(timeZones.BRUSSELS)
}

function isWeekend (zonedDateTime) {
  return zonedDateTime.dayOfWeek().value() > 5
}

function formatEpochSeconds (timeToBeReminded) {
  const time = Instant.EPOCH.plusSeconds(timeToBeReminded).atOffset(timeZones.BRUSSELS).toLocalTime()
  return `${time.hour()}:${time.minute()}`
}

module.exports = {
  timeZones,
  now,
  discordTime,
  isWeekend,
  formatEpochSeconds
}
