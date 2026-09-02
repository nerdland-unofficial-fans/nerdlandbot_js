const test = require('node:test')
const assert = require('node:assert/strict')
const { validateCronExpression } = require('cron')
const { discordTime } = require('../helpers/DateTimeHelper')

test('configured cron expressions remain valid', () => {
  assert.equal(validateCronExpression('* * * * *').valid, true)
  assert.equal(validateCronExpression('0 19 * * 5').valid, true)
  assert.equal(validateCronExpression('invalid').valid, false)
})

test('Discord time uses Brussels timezone', () => {
  assert.equal(discordTime().zone().id(), 'Europe/Brussels')
})
