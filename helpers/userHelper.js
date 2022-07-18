async function getMemberFromIdAsync (interaction, id) {
  return await interaction.guild.members.fetch(id)
}

async function getUserNameFromIdAsync (interaction, id) {
  const member = await getMemberFromIdAsync(interaction, id)
  if (member.nickname) { return member.nickname } else { return member.user.username }
}

function getTagFromId (id) {
  return `<@${id}>`
}

module.exports = {
  getMemberFromIdAsync,
  getUserNameFromIdAsync,
  getTagFromId
}
