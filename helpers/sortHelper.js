function caseInsensitiveSort (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

module.exports = {
  caseInsensitiveSort
}
