const { discordTime, isWeekend } = require('./DateTimeHelper')

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
