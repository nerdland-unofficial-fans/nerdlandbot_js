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

module.exports = {
  timeZones,
  now,
  discordTime,
  isWeekend
}
