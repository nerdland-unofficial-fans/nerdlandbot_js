const { SlashCommandBuilder } = require('@discordjs/builders')
const { reply } = require('../helpers/interactionHelper')
const { DAD_JOKE_URL } = require('../helpers/constants')
const axios = require('axios')

// @commands.command(name='dad_joke', aliases=['dadjoke'], help='dad_joke_help',no_pm = True)
// @commands.guild_only()
// async def cmd_dad_joke(self, ctx: commands.Context):
//     async with aiohttp.ClientSession() as session:
//         async with session.get(DAD_JOKE_URL,headers = { 'Accept': 'text/plain' }) as resp:
//             msg = await resp.text(encoding='utf-8')

//             # msg can contain utf 2028 charactercode which is line-separator, we're just converting it to '\n'
//             msg = '\n'.join(msg.splitlines())
//             await ctx.send(msg)

const data = new SlashCommandBuilder()
  .setName('dadjoke')
  .setDescription('Geeft een al dan niet flauwe mop')

async function execute (interaction) {
  const joke = (
    await axios.get(DAD_JOKE_URL, {
      headers: { Accept: 'text/plain', 'User-Agent': 'axios 0.21.1' }
    })
  ).data

  await reply(interaction, {
    content: joke,
    allowedMentions: { repliedUser: false }
  })
}

module.exports = {
  data,
  execute
}
