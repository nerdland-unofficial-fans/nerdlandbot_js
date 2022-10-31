
const { foemp } = require('./foemp')
const { DISCORD_MSG_MAX_LENGTH } = require('./constants')
const { getTagFromId } = require('./userHelper')
const { arrayIncludesString } = require('./arrayHelper')

async function getNotifyTags (notifyLists, listName) {
  const listNames = Object.keys(notifyLists)
  // check if list exists
  if (!arrayIncludesString(listNames, listName, false)) {
    throw new Error(`De lijst ${listName} bestaat niet, ${foemp()}!`)
  }

  // check to see if the list has any subscribers to notify
  const subscribers = notifyLists[listName]
  if (subscribers.length === 0) {
    throw new Error(`Er is nog niemand ingeschreven op deze lijst, ${foemp()}!`)
  }

  // build notification
  const tags = []
  let tag = ''
  const connection = ', '
  for (const id of subscribers) {
    const usr = getTagFromId(id)

    if (tag.length + connection.length + usr.length < DISCORD_MSG_MAX_LENGTH) {
      if (tag.length > 0) {
        tag += connection
      }
      tag += usr
    } else {
      tags.push(tag)
      tag = ''
    }
  }
  if (tag.length > 0) {
    tags.push(tag)
  }

  return tags
}

module.exports = {
  getNotifyTags
}
