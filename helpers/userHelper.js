async function getMemberFromIdAsync (interaction, id) {
  return await interaction.guild.members.fetch(id)
}

async function getUserNameFromIdAsync (interaction, id) {
  const member = await getMemberFromIdAsync(interaction, id)
  if (member.nickname) { return member.nickname } else { return member.user.username }
}

async function getTagFromIdAsync (interaction, id) {
  const member = await getMemberFromIdAsync(interaction, id)
  return member.user.toString()
}

module.exports = {
  getMemberFromIdAsync,
  getUserNameFromIdAsync,
  getTagFromIdAsync

}
