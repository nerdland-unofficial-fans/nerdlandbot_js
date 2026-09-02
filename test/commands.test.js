const test = require('node:test')
const assert = require('node:assert/strict')
const { InteractionContextType } = require('discord.js')
const { getAllCommandsSync } = require('../helpers/metadataHelper')

const guildOnlyCommands = new Set([
  'admins',
  'freegames',
  'membercount',
  'list',
  'purger',
  'reminder',
  'settings'
])

test('all command definitions serialize', () => {
  const commands = getAllCommandsSync().map(command => command.data.toJSON())

  assert.equal(commands.length, 13)
  assert.equal(new Set(commands.map(command => command.name)).size, commands.length)

  for (const command of commands) {
    assert.ok(command.name)
    assert.ok(command.description)
  }
})

test('guild-dependent commands only run in guilds', () => {
  const commands = getAllCommandsSync().map(command => command.data.toJSON())

  for (const command of commands.filter(command => guildOnlyCommands.has(command.name))) {
    assert.deepEqual(command.contexts, [InteractionContextType.Guild])
  }
})
