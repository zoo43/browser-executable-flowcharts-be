import axios from 'axios'

const _ = require('lodash')
const config = require('./config')
const exercises = require('./exercises')
axios.defaults.baseURL = 'http://127.0.0.1:5000';


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


function getUserId(done)
{
  if (!config.communications.enable) return
  axios.post('flowchart/getUserId').
    then((response) => {
      return done(response.data)
    })
    .catch(err => {
      if (config.communications.printErrors) {
        console.error(err)      
    }})
}

function getInTouch (exerciseid,done) {
  if (!config.communications.enable) return
  axios.post('/flowchart/getInTouch', { exId: exerciseid })
    .then((response) => {
      return(done(response.data))
    })
    .catch(err => {
      if (config.communications.printErrors) {
        console.error(err)
      }
    })
}



function executeFlowchart (data, nodes, functions,done) {
  const oldData = data
  if (config.communications.enable)
  {
    if(data.studentId !== "admin")
    {
      data = {
        exId : oldData.exId,
        studentId : oldData.studentId,
        output : oldData.output,
        nodes : nodes,
        functions : functions
      }
    }
    else
    {
      data.nodes = nodes
      data.functions = functions
    }
    data.type = "execution"
    axios.post("/flowchart/executeFlowchart", data)
    .then((response) => {
      return(done(response.data))
    })
    .catch(err => {
      if (config.communications.printErrors) {
        console.error(err)
      }
    })
  }
}

function updateFlowchart (data, nodes, functions) {
  const oldData = data
  if (config.communications.enable)
  {
    if(data.studentId !== "admin")
    {
      data = {
        exId : oldData.exId,
        studentId : oldData.studentId,
        nodes : nodes,
        functions : functions
        //output
      }
    }
    else
    {
      data.nodes = nodes
      data.functions = functions
      //output
    }
    data.type = "modification"
    axios.post("/flowchart/updateFlowchart", data)
    .then(() => {
    })
    .catch(err => {
      if (config.communications.printErrors) {
        console.error(err)
      }
    })
  }
}

const comm = {
  getExercise,
  getInTouch,
  getUserId,
  executeFlowchart,
  updateFlowchart
}

export default comm