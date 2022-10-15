function removeElementFromArray (array, element) {
  const index = array.indexOf(element)
  array.splice(index, 1)
}

module.exports = {
  removeElementFromArray
}
