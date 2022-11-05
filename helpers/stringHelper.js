function stringIncludes (str, partial, isCaseSensitive) {
  if (isCaseSensitive) {
    return str.includes(partial)
  } else {
    return str.toLowerCase().includes(partial.toLowerCase())
  }
}

module.exports = {
  stringIncludes
}
