function stringIncludes (str, partial, isCaseSensitive) {
  if (isCaseSensitive) {
    str.includes(partial)
  } else {
    str.toLowerCase(partial.toLowerCase())
  }
}

module.exports = {
  stringIncludes
}
