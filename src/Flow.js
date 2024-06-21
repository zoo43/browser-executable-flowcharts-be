import React from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { Play, ArrowCounterclockwise, Plus, Trash, Check } from 'react-bootstrap-icons'
import mermaid from 'mermaid'
import MemoryStates from './MemoryStates'
import StartModal from './NodeModals/StartModal'
import ExpressionModal from './NodeModals/ExpressionModal'
import ConditionModal from './NodeModals/ConditionModal'
import LoopModal from './NodeModals/LoopModal'
import LoopForModal from './NodeModals/LoopForModal'
import OutputModal from './NodeModals/OutputModal'
import ReturnValueModal from './NodeModals/ReturnValueModal'
import AssertModal from './NodeModals/AssertModal'
import FunctionDefineModal from './NodeModals/FunctionDefineModal'
import NopModal from './NodeModals/NopModal'
import comm from './communications'
import nodesUtils from './nodes'
import PropTypes from 'prop-types'
import exs from './examplePrograms'

const _ = require('lodash')
const config = require('./config')
const mermaidOptions = require('./mermaidOptions')
const executer = require('./executer')
const examplePrograms = require('./examplePrograms')
const utils = require('./utils')

const baseState = {
  exerciseid: 0,
  exerciseData: null,
  nodes: { main: [] },
  functions: { main: { params: [], signature: 'main', correct : true, returnType: 'Indefinito' }},
  previousStates: [],
  diagramStr: { main: '' },
  selectedNodeObj: null,
  newNodeType: '',
  newNodeParent: null,
  outputToShow: '',
  memoryStates: [],
  selectedFunc: 'main',
  selectedExampleProgram: _.keys(examplePrograms)[0],
  showDemo: true,
  checkedNodes : [],
  assignment: "",
  correctOutput: "",
  correctNodes: 2,
  modifyFunction: false
}

function pushLimit (arr, element) {
  const limit = 50
  if (arr.length >= limit) arr.shift()
  arr.push(element)
}

class Flow extends React.Component {
  constructor (props) {
    super(props)
    nodesUtils.initialize(this)

    this.state = _.cloneDeep(baseState)

    this.renderDiagram = this.renderDiagram.bind(this)
    this.drawFlowChart = this.drawFlowChart.bind(this)
    this.executeFlowchart = this.executeFlowchart.bind(this)
    this.selectNode = this.selectNode.bind(this)
    this.unselectNode = this.unselectNode.bind(this)
    this.addNode = this.addNode.bind(this)
    this.updateNode = this.updateNode.bind(this)
    this.deleteNode = this.deleteNode.bind(this)
    this.addExpressionNode = this.addExpressionNode.bind(this)
    this.addConditionNode = this.addConditionNode.bind(this)
    this.addAssertNode = this.addAssertNode.bind(this)
    this.addLoopNode = this.addLoopNode.bind(this)
    this.addLoopForNode = this.addLoopForNode.bind(this)
    this.addOutputNode = this.addOutputNode.bind(this)
    this.addFunction = this.addFunction.bind(this)
    this.confirmOutput = this.confirmOutput.bind(this)
    this.addReturnValueNode = this.addReturnValueNode.bind(this)
    this.shouldShowStartModal = this.shouldShowStartModal.bind(this)
    this.shouldShowExpressionModal = this.shouldShowExpressionModal.bind(this)
    this.shouldShowConditionModal = this.shouldShowConditionModal.bind(this)
    this.shouldShowLoopModal = this.shouldShowLoopModal.bind(this)
    this.shouldShowLoopForModal = this.shouldShowLoopForModal.bind(this)
    this.shouldShowOutputModal = this.shouldShowOutputModal.bind(this)
    this.shouldShowReturnValueModal = this.shouldShowReturnValueModal.bind(this)
    this.shouldShowAssertModal = this.shouldShowAssertModal.bind(this)
    this.shouldShowNopModal = this.shouldShowNopModal.bind(this)
    this.shouldShowFunctionDefineModal = this.shouldShowFunctionDefineModal.bind(this)
    this.showExecutionFeedback = this.showExecutionFeedback.bind(this)
    this.setupFunctionBaseNodes = this.setupFunctionBaseNodes.bind(this)
    this.selectFunctionTab = this.selectFunctionTab.bind(this)
    this.updateSelectedExampleProgram = this.updateSelectedExampleProgram.bind(this)
    this.loadExampleProgram = this.loadExampleProgram.bind(this)
    this.loadPredefinedNodes = this.loadPredefinedNodes.bind(this)
    this.deleteSelectedFunction = this.deleteSelectedFunction.bind(this)
    this.checkSignedNodes = this.checkSignedNodes.bind(this)
    this.findCheckedNodes = this.findCheckedNodes.bind(this)
    this.changeAssignment = this.changeAssignment.bind(this)
    this.updateFunction = this.updateFunction.bind(this)
    this.undo = this.undo.bind(this)
  }

  componentDidMount () {
    if (config.renderer === 'mermaid') {
      mermaid.initialize(mermaidOptions.initialize)
    }
    const urlParams = new URLSearchParams(window.location.search)
    const exId = urlParams.get('exerciseid')
    if (!_.isNil(exId)) {
      if (exId === 'demoloader') {
        this.setState({
          exerciseid: exId,
          showDemo: !config.communications.enable
        }, () => {
          comm.getInTouch(this.state.exerciseid)
          this.setupFunctionBaseNodes('main')
          this.renderDiagram()
        })
      } else {
        comm.getExercise(exId, exData => {
          if (_.isNil(exData)) {
            comm.getInTouch(exId + 'NO_DATA')
            this.setupFunctionBaseNodes('main')
            this.renderDiagram()
          } else {
            const nodes = exData.data.nodes
            const functions = exData.data.functions

            this.setState({
              exerciseid: exId,
              exerciseData: exData
            }, () => {
              comm.getInTouch(this.state.exerciseid)
              this.loadPredefinedNodes(nodes, functions)
            })
          }
        })
      }
    } else {
      comm.getInTouch('FREE_MODE')
      this.setupFunctionBaseNodes('main')
      this.renderDiagram()
    }
  }




  undo () {
    const previousStates = this.state.previousStates
    const newNodes = previousStates.pop()
    this.setState({
      nodes: newNodes,
      previousStates,
      selectedNodeObj: null,
      newNodeType: '',
      newNodeParent: null
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }

  updateSelectedExampleProgram (ev) {
    this.setState({
      selectedExampleProgram: ev.target.value
    })
  }

  loadPredefinedNodes (nodes, functions, checkedNodes, assignment) {
    const showDemo = _.clone(this.state.showDemo)
    const newState = _.cloneDeep(baseState)
    newState.exerciseid = _.clone(this.state.selectedExampleProgram)
    newState.exerciseData = _.clone(this.state.exerciseData)
    newState.nodes = nodes
    newState.functions = functions
    newState.previousStates = []
    newState.showDemo = showDemo
    newState.checkedNodes = checkedNodes
    newState.assignment = assignment
    nodesUtils.updateBaseId(nodes)
    this.setState(newState, this.renderDiagram)
  }

  findCheckedNodes(nodes,firstLoad=false)
  {
    const checkedNodes = []
    nodes.forEach((node) =>{
        if(node.checked){
          if(firstLoad)
            node.checked = false //On the first load I wish to not see the checkedNodes (Student load the exercise)
          checkedNodes.push(node.id)
        }})
    return checkedNodes
  }


  setupFunctionBaseNodes (func) {
    const startNode = nodesUtils.getNewNode('start')[0]
    const endNode = nodesUtils.getNewNode('end')[0]

    const stateNodes = this.state.nodes
    stateNodes[func].push(startNode)
    stateNodes[func].push(endNode)

    nodesUtils.connectNodes(startNode, 'main', endNode, this.state.nodes[func])
  }

  selectFunctionTab (tabKey) {
    if(tabKey === this.state.selectedFunc && this.state.selectedFunc!=="main")
    {
      this.setState(
        {
          modifyFunction : true
        }
      )
    }
    else
    {
      this.setState({
        selectedFunc: tabKey
      }, this.renderDiagram)
    }
  }

  deleteSelectedFunction () {
    const nodes = this.state.nodes
    const previousStates = this.state.previousStates
    pushLimit(previousStates, _.cloneDeep(nodes))

    delete nodes[this.state.selectedFunc]
    this.setState({
      nodes,
      previousStates,
      selectedFunc: 'main'
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }


  adjustType(variableType)
  {
    switch (variableType)
    {
      case 'Numero':
        return "number"
      case "Stringa":
        return "string"
      case "Bool":
        return "boolean"
      case "Array":
        return "object"
      case "Indefinito":
        return ""
      default:
        return "undefined"
    }

  }


  unitTest(calcData)
  {
    let newFunctions = _.cloneDeep(this.state.functions)
    console.log(this.state.functions)
    for (const fun in this.state.functions)
    {
      const actualFun = this.state.functions[fun]
      newFunctions[fun].correct = true
      

      const funReturnType = calcData.returnVal2[fun] === "true" || calcData.returnVal2[fun] === "false" ? "boolean" : typeof(calcData.returnVal2[fun]) //Should be something else, not assigned not work
      if(this.adjustType(actualFun.returnType) !== funReturnType && this.adjustType(actualFun.returnType) !== "")
      {
        newFunctions[fun].correct = false
      }
      
      for (const param in actualFun.params)
      {
        const actualParam = actualFun.params[param]
        for(const node in calcData.memoryStates)
        {
          const actualNode = calcData.memoryStates[node]
          if(actualNode.func === fun && actualNode.type === "start") //I check things on the start
          {
            if((this.adjustType(actualParam.type) !== typeof(actualNode.memory[fun][0][actualParam.name]) && this.adjustType(actualParam.type) !== ""))
            {
              newFunctions[fun].correct = false
            }
          }
        }
      }
    }
    this.setState({
      functions : newFunctions
    })
      //res.returnVal
  }



  executeFlowchart () {
    console.log(JSON.stringify({ nodes: this.state.nodes, functions: this.state.functions }))
    try {
      const startNode = _.find(this.state.nodes.main, { nodeType: 'start' })
      const res = executer.executeFromNode(
        startNode,
        this.state.nodes,
        this.state.functions,
        'main',
        executer.getNewCalcData(this.state.nodes, this.state.functions)
      )

      this.unitTest(res)

      
      const outputToSend = this.showExecutionFeedback(res)
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes, "output": outputToSend}
      if(data.studentId === "admin")
        data.output = this.state.correctOutput
      comm.executeFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions), res => {alert(res)})
      
      //Here I should check if it's correct
    } catch (err) {
      let alertMsg = 'Errore di esecuzione'
      if (err.message === 'too much recursion') {
        alertMsg += ': il diagramma sta eseguendo troppi cicli, potrebbe mancare un aggiornamento di variabile.'
      }
      console.log('Error message: ', err.message)
      alert(alertMsg)
    }
    this.setState({nodes: this.state.nodes},this.renderDiagram)
  }

  showExecutionFeedback (data) {
    // Handle "console" output
    let fullOutput = ''
    for (const output of data.outputs) {
      fullOutput += output.str
    }
    // Newline
    fullOutput = fullOutput.replaceAll('\\n', '<br/>')
    // Spaces
    fullOutput = fullOutput.replaceAll(' ', '&nbsp;')
    
    this.setState({ outputToShow: fullOutput, memoryStates:data.memoryStates })
    return fullOutput
  }

  renderDiagram () {
    const diagramStr = {}
    for (const func in this.state.nodes) {
      const funcStr = nodesUtils.convertToDiagramStr(this.state.nodes[func], true)
      diagramStr[func] = funcStr
      // console.log('########', func)
      // console.log(diagramStr[func])
    }


    this.setState({
      diagramStr
    }, this.drawFlowChart)
  }

  drawFlowChart () {
    nodesUtils.drawFlowCharts(
      this.state.diagramStr,
      'flowchartDiv',
      this.state.selectedFunc,
      false
    )
  }

  selectNode (selectedNode) {
    const nodeId = parseInt(selectedNode)
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const selectedNodeObj = _.find(selectedFuncNodes, { id: nodeId })
    // First unselect other nodes
    for (const func in this.state.nodes) {
      for (const node of this.state.nodes[func]) node.selected = false
    }

    // Then select current node
    if (!_.isNil(selectedNodeObj)) selectedNodeObj.selected = true

    // Handle potential parents
    const selectedNodeParents = []
    if (!_.isNil(selectedNodeObj) && !_.isNil(selectedNodeObj.parents)) {
      for (const parent of selectedNodeObj.parents) {
        const parentNode = _.find(selectedFuncNodes, { id: parent.id })
        const parentBranch = _.find(_.keys(parentNode.children), b => { return parentNode.children[b] === nodeId })
        selectedNodeParents.push({ node: parentNode, branch: parentBranch })
      }
    }

    this.setState({
      newNodeType: '',
      selectedNodeObj: selectedNodeObj,
      selectedNodeParents: selectedNodeParents
    }, this.renderDiagram)
  }

  unselectNode (updated) {
    for (const func in this.state.nodes) {
      for (const node of this.state.nodes[func]) node.selected = false
    }

    if (updated) {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
    }

    this.setState({
      newNodeType: '',
      selectedNodeObj: null,
      modifyFunction : false
    }, this.renderDiagram)
  }

  addNode (type, parent, branch) {
    this.selectNode(-1)
    this.setState({
      newNodeType: type,
      selectedNodeParents: [{ node: parent, branch: branch }]
    })
  }

  updateFunction(data,done){
    let newFunctions = _.cloneDeep(this.state.functions)
    newFunctions[this.state.selectedFunc].signature = data.signature
    newFunctions[this.state.selectedFunc].params = data.functionParameters
    newFunctions[this.state.selectedFunc].correct = true
    newFunctions[this.state.selectedFunc].returnType = data.returnType
    //change function
    this.setState(
    {
      functions:newFunctions
    })
    return done()
  }


  updateNode (data, done) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    nodesUtils.updateNode(data, selectedFuncNodes)

    return done()
  }

  deleteNode (data, done) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    nodesUtils.deleteNode(data, selectedFuncNodes)

    return done()
  }

  addExpressionNode (data) {
    const nodes = this.state.nodes
    const previousStates = this.state.previousStates
    pushLimit(previousStates, _.cloneDeep(nodes))

    const selectedFuncNodes = nodes[this.state.selectedFunc]
    const newExpressionNode = nodesUtils.getNewNode('expression', data)[0]
    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      const newSubGraph = {
        entry: newExpressionNode,
        exit: newExpressionNode
      }
      nodesUtils.connectGraphs(newNodeParent, parentInfo.branch, newSubGraph, selectedFuncNodes)
    }

    selectedFuncNodes.push(newExpressionNode)
    nodesUtils.markUnreachableNodes(selectedFuncNodes)

    this.setState({
      nodes,
      previousStates
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }

  addConditionNode (data) {
    const nodes = this.state.nodes
    const previousStates = this.state.previousStates
    pushLimit(previousStates, _.cloneDeep(nodes))
    const selectedFuncNodes = nodes[this.state.selectedFunc]
    const newConditionNodes = nodesUtils.getNewNode('condition', data)

    const conditionNode = newConditionNodes[0]
    const closeConditionNode = newConditionNodes[1]

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      const newSubGraph = {
        entry: conditionNode,
        exit: closeConditionNode
      }
      nodesUtils.connectGraphs(newNodeParent, parentInfo.branch, newSubGraph, selectedFuncNodes)
    }

    selectedFuncNodes.push(conditionNode)
    selectedFuncNodes.push(closeConditionNode)
    nodesUtils.markUnreachableNodes(selectedFuncNodes)

    this.setState({
      nodes,
      previousStates
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }


  addAssertNode (data) {
    const nodes = this.state.nodes
    const previousStates = this.state.previousStates
    pushLimit(previousStates, _.cloneDeep(nodes))

    const selectedFuncNodes = nodes[this.state.selectedFunc]
    const newAssertionNode = nodesUtils.getNewNode('assertion', data)[0]

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      const newSubGraph = {
        entry: newAssertionNode,
        exit: newAssertionNode
      }
      nodesUtils.connectGraphs(newNodeParent, parentInfo.branch, newSubGraph, selectedFuncNodes)
    }

    selectedFuncNodes.push(newAssertionNode)
    nodesUtils.markUnreachableNodes(selectedFuncNodes)

    this.setState({
      nodes,
      previousStates
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }

  addLoopNode (data) {
    const nodes = this.state.nodes
    const previousStates = this.state.previousStates
    pushLimit(previousStates, _.cloneDeep(nodes))
    const selectedFuncNodes = nodes[this.state.selectedFunc]
    const newLoopNodes = nodesUtils.getNewNode('loop', data)

    const conditionNode = newLoopNodes[0]
    const loopRestartNode = newLoopNodes[1]
    const loopEndNode = newLoopNodes[2]

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      const newSubGraph = {
        entry: conditionNode,
        exit: loopEndNode
      }
      nodesUtils.connectGraphs(newNodeParent, parentInfo.branch, newSubGraph, selectedFuncNodes)
    }

    selectedFuncNodes.push(conditionNode)
    selectedFuncNodes.push(loopRestartNode)
    selectedFuncNodes.push(loopEndNode)
    nodesUtils.markUnreachableNodes(selectedFuncNodes)

    this.setState({
      nodes,
      previousStates
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }

  addLoopForNode (data) {
    const nodes = this.state.nodes
    const previousStates = this.state.previousStates
    pushLimit(previousStates, _.cloneDeep(nodes))
    const selectedFuncNodes = nodes[this.state.selectedFunc]
    const newLoopForNodes = nodesUtils.getNewNode('loopFor', data)

    const conditionNode = newLoopForNodes[0]
    const loopRestartNode = newLoopForNodes[1]
    const loopEndNode = newLoopForNodes[2]

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      const newSubGraph = {
        entry: conditionNode,
        exit: loopEndNode
      }
      nodesUtils.connectGraphs(newNodeParent, parentInfo.branch, newSubGraph, selectedFuncNodes)
    }

    selectedFuncNodes.push(conditionNode)
    selectedFuncNodes.push(loopRestartNode)
    selectedFuncNodes.push(loopEndNode)
    nodesUtils.markUnreachableNodes(selectedFuncNodes)

    this.setState({
      nodes,
      previousStates
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }

  addOutputNode (data) {
    const nodes = this.state.nodes
    const previousStates = this.state.previousStates
    pushLimit(previousStates, _.cloneDeep(nodes))
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const newOutputNode = nodesUtils.getNewNode('output', data)[0]

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      const newSubGraph = {
        entry: newOutputNode,
        exit: newOutputNode
      }
      nodesUtils.connectGraphs(newNodeParent, parentInfo.branch, newSubGraph, selectedFuncNodes)
    }

    selectedFuncNodes.push(newOutputNode)
    nodesUtils.markUnreachableNodes(selectedFuncNodes)

    this.setState({
      nodes,
      previousStates
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }

  addReturnValueNode (data) {
    const nodes = this.state.nodes
    const previousStates = this.state.previousStates
    pushLimit(previousStates, _.cloneDeep(nodes))
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const newReturnValueNode = nodesUtils.getNewNode('returnValue', data)[0]

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      const newSubGraph = {
        entry: newReturnValueNode,
        exit: newReturnValueNode
      }
      nodesUtils.connectGraphs(newNodeParent, parentInfo.branch, newSubGraph, selectedFuncNodes)
    }

    selectedFuncNodes.push(newReturnValueNode)
    nodesUtils.markUnreachableNodes(selectedFuncNodes)

    this.setState({
      nodes,
      previousStates
    }, () => {
      const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
      comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
      this.renderDiagram()
    })
  }

  addFunction (data) {
    const functionName = data.functionName
    if (_.isNil(this.state.nodes[functionName])) {
      const nodes = this.state.nodes
      const functions = this.state.functions
      const previousStates = this.state.previousStates
      pushLimit(previousStates, _.cloneDeep(nodes))

      nodes[functionName] = []
      functions[functionName] = { params: data.functionParameters, signature: utils.getFunctionSignature(data.functionName, data.functionParameters), correct:true, returnType:data.returnType}
      this.setState({
        nodes,
        functions,
        previousStates
      }, () => {
        this.setupFunctionBaseNodes(functionName)
        const data = {"studentId":this.props.studentId, "exId" : this.state.exerciseid , "assignment" : this.state.assignment, "correctNodes" : this.state.correctNodes}
        comm.updateFlowchart(data, _.cloneDeep(this.state.nodes), _.cloneDeep(this.state.functions))
        this.renderDiagram()
      })
    }
  }

  checkSignedNodes()
  {
    const checkedNodes = this.state.checkedNodes //Checked nodes signed by me
    const signedNodes = this.findCheckedNodes(this.state.nodes["main"]) //Signed signed by user
    let correctNodesCounter = 0
    checkedNodes.forEach((id) =>
    { 
      signedNodes.forEach((element) =>
      {
        if(element === id)
          correctNodesCounter++
      })
    })
    
    alert("Hai segnato " + signedNodes.length + " nodi e " + correctNodesCounter + " di questi sono corretti su un totale di " + checkedNodes.length + " nodi corretti")
  }


  changeAssignment(ev)
  { 
     this.setState({
      assignment:ev.target.value
    })
  }


  loadExampleProgram () {
    
    const programNodes = _.cloneDeep(examplePrograms[this.state.selectedExampleProgram].nodes)
    const checkedNodes = this.findCheckedNodes(programNodes["main"],true)
    const programFunctions = _.cloneDeep(examplePrograms[this.state.selectedExampleProgram].functions)
    const assignment = examplePrograms[this.state.selectedExampleProgram].assignment
    this.loadPredefinedNodes(programNodes, programFunctions, checkedNodes, assignment)
  }


  confirmOutput()
  {
/*  Remove this characters
    fullOutput = fullOutput.replaceAll('\\n', '<br/>')
    // Spaces
    fullOutput = fullOutput.replaceAll(' ', '&nbsp;')*/
    this.setState({correctOutput : this.state.outputToShow})
  }

  shouldShowStartModal () {
    return !_.isNil(this.state.selectedNodeObj) &&
      this.state.selectedNodeObj.type === 'start'
  }

  shouldShowExpressionModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'expression') ||
    (this.state.newNodeType === 'expression')
  }

  shouldShowConditionModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'condition') ||
    (this.state.newNodeType === 'condition')
  }

  shouldShowAssertModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'assertion') ||
    (this.state.newNodeType === 'assertion')
  }

  shouldShowLoopModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'loop') ||
    (this.state.newNodeType === 'loop')
  }

  shouldShowLoopForModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'loopFor') ||
    (this.state.newNodeType === 'loopFor')
  }

  shouldShowOutputModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'output') ||
    (this.state.newNodeType === 'output')
  }

  shouldShowReturnValueModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'returnValue') ||
    (this.state.newNodeType === 'returnValue')
  }

  shouldShowNopModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'nop') ||
    (this.state.newNodeType === 'nop')
  }

  shouldShowFunctionDefineModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'functionCall') ||
    (this.state.newNodeType === 'functionCall') || 
    this.state.modifyFunction
  }




  render () {
    return (
      <div>
        {this.state.exerciseid !== '' && !_.isNil(this.state.exerciseData) && this.state.exerciseData.text !== '' &&
        <div>
          <Row>
            <Col xs={1}></Col>
            <Col xs={10}
              dangerouslySetInnerHTML={{__html: this.state.exerciseData.text }}
              style={{ backgroundColor: '#f4f4f4', border: '1px solid black', margin: '10px', padding: '5px' }}
            ></Col>
            <Col xs={1}></Col>
          </Row>
        </div>
        }

        <Row>
          <Col xs={8}>
            <ButtonGroup>
              <Button variant='secondary' disabled={this.state.previousStates.length === 0} onClick={this.undo}>
                <ArrowCounterclockwise/> Undo
              </Button>
              <Button variant='dark' onClick={() => { this.addNode('functionCall') }}>
                <Plus /> Aggiungi funzione
              </Button>
              <Button variant='success' onClick={() => { this.checkSignedNodes() }}>
                <Check /> Controlla Nodi Segnati
              </Button>
              {this.state.selectedFunc !== 'main' &&
              <Button variant='danger' onClick={this.deleteSelectedFunction} disabled={this.state.selectedFunc === 'main'}>
                <Trash /> Elimina funzione "{this.state.selectedFunc}"
              </Button>
              }
              {this.props.studentId === 'admin' &&
              <Button variant='dark' onClick={this.confirmOutput}>
                <Trash /> Conferma Output
              </Button>
              }                 
            </ButtonGroup>

          </Col>
          <Col xs={4} style={{ textAlign: 'right' }}>
            <p className="mx-2" style={{ fontWeight: 'bold' , display:'inline'}}> Id: {this.props.studentId} </p>
            <Button variant='primary' onClick={this.executeFlowchart}>
              <Play /> Esegui
            </Button>
          </Col>
        </Row>
        <Tabs activeKey={this.state.selectedFunc} onSelect={this.selectFunctionTab}>
        {_.keys(this.state.nodes).map((func, idx) => {
          return (
            <Tab tabClassName={this.state.functions[func].correct ? "true" : "false"} eventKey={func} title={this.state.functions[func].signature} key={idx}> 
              <h4> Consegna :  { this.state.assignment } </h4>
              <Row>
                <Col xs={8}>
                  <h3>Diagramma - {this.state.functions[this.state.selectedFunc].signature}</h3>
                  <div className='' id={'flowchartDiv' + func} />
                </Col>

                <Col xs={4}>
                  <h3>Output</h3>
                  <div id='flowChartOutputDiv' dangerouslySetInnerHTML={{__html: this.state.outputToShow}} style={{ width: '100%', height: '500px', border: '5px solid black' }}>
                  </div>
                </Col>
              </Row>
            </Tab>
          )
        })}
        </Tabs>
        <hr/>
        <Row style={{ marginBottom: '100px' }}>
          <Col xs={1}></Col>
          <Col xs={10}>
            {this.state.memoryStates.length > 0 &&
              <MemoryStates memoryStates={_.cloneDeep(this.state.memoryStates)} nodes={_.cloneDeep(this.state.nodes)}  />
            }
          </Col>
          <Col xs={1}></Col>
        </Row>

        <hr />

        {this.state.showDemo &&
          <Row>
            <Col xs={3}>
              <Form.Select value={this.state.selectedExampleProgram} onChange={this.updateSelectedExampleProgram}>
                {_.keys(examplePrograms).map((progName, idx) => {
                 // console.log(progName)
                  return (
                    <option key={idx} value={idx}>{idx}</option>
                  )
                })}
              </Form.Select>
            </Col>
            <Col xs={3}>
              <Button variant='primary' onClick={this.loadExampleProgram}>
                Carica demo
              </Button>
            </Col>
            <Col xs={3}>
              <input
                type="text"
                value={this.state.assignment}
                onChange={this.changeAssignment}
              />
            </Col>
          </Row>
        }

        {this.shouldShowStartModal() &&
          <StartModal
            node={this.state.selectedNodeObj}
            show={this.shouldShowStartModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
          />
        }

        {this.shouldShowExpressionModal() &&
          <ExpressionModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            parents={this.state.selectedNodeParents}
            functions={_.keys(this.state.nodes)}
            show={this.shouldShowExpressionModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addExpressionNode}
            updateNodeCallback={this.updateNode}
            deleteNodeCallback={this.deleteNode}
          />
        }

        {this.shouldShowConditionModal() &&
          <ConditionModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            functions={_.keys(this.state.nodes)}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowConditionModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addConditionNode}
            updateNodeCallback={this.updateNode}
            deleteNodeCallback={this.deleteNode}
          />
        }

        {this.shouldShowLoopModal() &&
          <LoopModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            functions={_.keys(this.state.nodes)}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowLoopModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addLoopNode}
            updateNodeCallback={this.updateNode}
            deleteNodeCallback={this.deleteNode}
          />
        }

        {this.shouldShowLoopForModal() &&
          <LoopForModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            functions={_.keys(this.state.nodes)}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowLoopForModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addLoopForNode}
            updateNodeCallback={this.updateNode}
            deleteNodeCallback={this.deleteNode}
          />
        }

        {this.shouldShowOutputModal() &&
          <OutputModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowOutputModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addOutputNode}
            updateNodeCallback={this.updateNode}
            deleteNodeCallback={this.deleteNode}
          />
        }

        {this.shouldShowReturnValueModal() &&
          <ReturnValueModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowReturnValueModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addReturnValueNode}
            updateNodeCallback={this.updateNode}
            deleteNodeCallback={this.deleteNode}
          />
        }

        {this.shouldShowAssertModal() &&
          <AssertModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            functions={_.keys(this.state.nodes)}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowAssertModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addAssertNode}
            updateNodeCallback={this.updateNode}
            deleteNodeCallback={this.deleteNode}
          />
        }

        {this.shouldShowNopModal() &&
          <NopModal
            node={this.state.selectedNodeObj}
            show={this.shouldShowNopModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
          />
        }

        {this.shouldShowFunctionDefineModal() &&
          <FunctionDefineModal
            show={this.shouldShowFunctionDefineModal()}
            closeCallback={this.unselectNode}
            addFunctionCallback={this.addFunction}
            updateNodeCallback={this.updateFunction}
            functionData={this.state.functions[this.state.selectedFunc]}
            functionName={this.state.selectedFunc}
            modifyFunction={this.state.modifyFunction}
          />
        }
      </div>
    )
  }
}


Flow.propTypes = {
  studentId : PropTypes.string
}

export default Flow
