const { ZoneId, Instant } = require('@js-joda/core')
require('@js-joda/timezone')

const TimeZones = {
  BRUSSELS: ZoneId.of('Europe/Brussels')
}

function Now (zone) {
  return Instant.now().atZone(zone)
}

function DiscordTime () {
  return Now(TimeZones.BRUSSELS)
}

function isWeekend (zonedDateTime) {
  return zonedDateTime.dayOfWeek().value() > 5
}

module.exports = {
  TimeZones,
  Now,
  DiscordTime,
  isWeekend
}
