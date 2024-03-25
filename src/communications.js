import axios from 'axios'

const _ = require('lodash')
const config = require('./config')
const exercises = require('./exercises')

function getExercise (exerciseid, done) {
  const localData = _.find(exercises, { id: exerciseid, type: 'control' })
  if (!config.communications.enable) return done(localData)

  axios.post('/flowchart/getExercise', { exId: exerciseid })
    .then(response => {
      return done(response.data.exercise)
    })
    .catch(err => {
      if (config.communications.printErrors) {
        console.error(err)
      }

      return done(localData)
    })
}

function getInTouch (exerciseid) {
  if (!config.communications.enable) return
  axios.post('/flowchart/getInTouch', { exId: exerciseid })
    .then(() => {
    })
    .catch(err => {
      if (config.communications.printErrors) {
        console.error(err)
      }
    })
}

function executeFlowchart (exerciseid, nodes, functions) {
  if (!config.communications.enable) return
  const data = {
    exId: exerciseid,
    nodes: nodes,
    functions: functions
  }

  axios.post('/flowchart/executeFlowchart', data)
    .then(() => {
    })
    .catch(err => {
      if (config.communications.printErrors) {
        console.error(err)
      }
    })
}

function updateFlowchart (exerciseid, nodes, functions) {
  if (!config.communications.enable) return
  const data = {
    exId: exerciseid,
    nodes: nodes,
    functions: functions
  }

  axios.post('/flowchart/updateFlowchart', data)
    .then(() => {
    })
    .catch(err => {
      if (config.communications.printErrors) {
        console.error(err)
      }
    })
}

const comm = {
  getExercise,
  getInTouch,
  executeFlowchart,
  updateFlowchart
}

export default comm