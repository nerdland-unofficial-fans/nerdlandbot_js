module.exports = {
    pingPrefix: async function pingPrefix(message) {
    message.channel.send("pong")
    },
    pingSlash: async function pingSlash(interaction) {
    interaction.reply("pong")
    }
}
