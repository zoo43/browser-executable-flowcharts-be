const _ = require('lodash')

const exerciseTexts = {
}

function getText (id) {
  if (!_.isNil(exerciseTexts[id])) return exerciseTexts[id]
  else return ''
}

module.exports = {
  getText
}
