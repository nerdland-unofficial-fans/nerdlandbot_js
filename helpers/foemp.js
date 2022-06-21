const { DiscordTime, isWeekend } = require('./DateTimeHelper')

function foemp (interaction) {
  if (isWeekend(DiscordTime())) {
    return 'schatje'
  } else {
    return 'foemp'
  }
}

module.exports = {
  foemp
}
