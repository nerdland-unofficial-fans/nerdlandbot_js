function removeElementFromArray (array, element) {
  const index = array.indexOf(element)
  array.splice(index, 1)
}

function arrayIncludesString (array, element, isCaseSensitive) {
  if (isCaseSensitive) {
    return array.some(e => e === element)
  } else {
    const match = element.toLowerCase()
    return array.some(e => e.toLowerCase() === match)
  }
}

module.exports = {
  removeElementFromArray,
  arrayIncludesString
}
