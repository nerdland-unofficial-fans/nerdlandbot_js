const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply } = require('../helpers/interactionHelper')
const { WOMBATS_DIR_NAME } = require('../helpers/constants')
const log = require('../helpers/logger')
const path = require('path')
const fs = require('fs/promises')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wombat')
    .setDescription('Post een willekeurige foto van een wombat.'),
  async execute (interaction) {
    let wombatList
    try {
      wombatList = await fs.readdir(path.resolve(WOMBATS_DIR_NAME))

      if (wombatList.length === 0) {
        throw new Error("Map met foto's is leeg")
      }
    } catch (error) {
      log.error(error)
      return reply(interaction, "Er zijn geen wombat foto's gevonden.")
    }

    const wombatPhoto =
      wombatList[Math.floor(Math.random() * wombatList.length)]
    return reply(interaction, {
      files: [path.resolve(WOMBATS_DIR_NAME, wombatPhoto)]
    })
  }
}
