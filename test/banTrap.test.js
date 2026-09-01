const test = require('node:test')
const assert = require('node:assert/strict')
const { ChannelType, PermissionsBitField } = require('discord.js')
const { isExempt, isModerator, onBanTrapMessageAsync } = require('../eventHandlers/onBanTrapMessage')
const { getDeleteHistoryHours, getGuild } = require('../helpers/guildData')
const { BAN_TRAP_DEFAULT_DELETE_HOURS, BAN_TRAP_MAX_DELETE_HOURS } = require('../helpers/constants')
const settingsCommand = require('../commands/settings')

function memberWithPermissions (...permissions) {
  return { permissions: new PermissionsBitField(permissions) }
}

test('ban trap command accepts text channels and a bounded history', () => {
  const command = settingsCommand.data.toJSON()
  const setBanTrap = command.options.find(option => option.name === 'set_ban_trap')
  const channel = setBanTrap.options.find(option => option.name === 'channel')
  const deleteHistory = setBanTrap.options.find(option => option.name === 'delete_history_hours')

  assert.deepEqual(channel.channel_types, [ChannelType.GuildText])
  assert.equal(deleteHistory.min_value, 0)
  assert.equal(deleteHistory.max_value, BAN_TRAP_MAX_DELETE_HOURS)
})

test('ban trap delete history uses configured, bounded, or default hours', () => {
  assert.equal(getDeleteHistoryHours({ banTrap: { deleteHistoryHours: 12 } }), 12)
  assert.equal(getDeleteHistoryHours({ banTrap: { deleteHistoryHours: -1 } }), 0)
  assert.equal(getDeleteHistoryHours({ banTrap: { deleteHistoryHours: 25 } }), BAN_TRAP_MAX_DELETE_HOURS)
  assert.equal(getDeleteHistoryHours({ banTrap: { deleteHistoryHours: 'invalid' } }), BAN_TRAP_DEFAULT_DELETE_HOURS)
  assert.equal(getDeleteHistoryHours({ banTrap: null }), BAN_TRAP_DEFAULT_DELETE_HOURS)
})

test('ban trap exempts Discord moderators', () => {
  assert.equal(isModerator(memberWithPermissions(PermissionsBitField.Flags.Administrator)), true)
  assert.equal(isModerator(memberWithPermissions(PermissionsBitField.Flags.ManageMessages)), true)
  assert.equal(isModerator(memberWithPermissions(PermissionsBitField.Flags.ModerateMembers)), true)
  assert.equal(isModerator(memberWithPermissions()), false)
})

test('ban trap exempts configured bot admins', () => {
  const member = memberWithPermissions()
  member.id = 'bot-admin-id'

  assert.equal(isExempt(member, { admins: ['bot-admin-id'] }), true)
  assert.equal(isExempt(member, { admins: [] }), false)
})

test('ban trap deletes the trigger and bans the member', async () => {
  const guildId = `ban-trap-test-${process.pid}`
  const channelId = 'trap-channel'
  const guildData = await getGuild(guildId)
  guildData.banTrap = { channelId, deleteHistoryHours: 24 }

  let deleted = false
  let banOptions
  const member = memberWithPermissions()
  member.id = 'member-id'
  member.bannable = true
  member.ban = async options => { banOptions = options }

  await onBanTrapMessageAsync({
    id: 'message-id',
    guildId,
    channelId,
    author: { bot: false, id: member.id },
    member,
    inGuild: () => true,
    delete: async () => { deleted = true }
  })

  assert.equal(deleted, true)
  assert.equal(banOptions.deleteMessageSeconds, 24 * 60 * 60)
})

test('ban trap ignores direct messages and bots', async () => {
  await onBanTrapMessageAsync({
    inGuild: () => false,
    author: { bot: false }
  })

  await onBanTrapMessageAsync({
    inGuild: () => true,
    author: { bot: true }
  })
})
