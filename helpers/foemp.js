const { discordTime, isWeekend } = require('./dateTimeHelper')

function foemp (interaction) {
  if (isWeekend(discordTime())) {
    return 'schatje'
  } else {
    return 'foemp'
  }
}

module.exports = {
  foemp
}
