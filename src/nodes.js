import mermaid from 'mermaid'

const _ = require('lodash')
const config = require('./config')
const mermaidOptions = require('./mermaidOptions')

let ID = 0
let NOP_ID = 10000

const NODES = {
  start: {
    type: 'start',
    nodeType: 'start'
  },
  end: {
    type: 'end',
    nodeType: 'end'
  },
  expression: {
    type: 'expression',
    nodeType: 'operation'
  },
  assertion: {
    type: 'assertion',
    nodeType: 'condition'
  },
  condition: {
    type: 'condition',
    nodeType: 'condition'
  },
  loop: {
    type: 'loop',
    nodeType: 'condition'
  },
  loopFor: {
    type: 'loopFor',
    nodeType: 'condition'
  },
  nop: {
    type: 'nop',
    nodeType: 'operation'
  },
  nopNoModal: {
    type: 'nopNoModal',
    nodeType: 'operation'
  },
  output: {
    type: 'output',
    nodeType: 'inputoutput'
  },
  returnValue: {
    type: 'returnValue',
    nodeType: 'operation'
  }
}

const replaceSymbols = [
  { sym: '>=', rep: '≥' },
  { sym: '<=', rep: '≤' },
  { sym: /"/g, rep: '\'\''},
  { sym: /\s*<\s*/g, rep: ' < '},
  { sym: /\s*>\s*/g, rep: ' > '}
]

function cleanupExpression (expression) {
  let cleanExpression = expression
  for (const el of replaceSymbols) {
    cleanExpression = cleanExpression.replaceAll(el.sym, el.rep)
  }
  return cleanExpression
}

function getNodeText (type, data) {
  let newNodeText = ''
  if (type === 'start') {
    newNodeText = 'Start'
  } else if (type === 'end') {
    newNodeText = 'End'
  } else if (type === 'expression') {
    for (let i = 0; i < data.expressions.length; i++) {
      const expression = data.expressions[i]
      newNodeText += cleanupExpression(expression)
      if (i < data.expressions.length - 1) newNodeText += '\n'
    }
  } else if (type === 'condition') {
    newNodeText += cleanupExpression(data.condition)
  } else if (type === 'assertion') {
    newNodeText += cleanupExpression(data.condition)
  } else if (type === 'loop') {
    newNodeText += cleanupExpression(data.condition)
  } else if (type === 'output') {
    newNodeText += 'print \'' + data.output + '\''
  } else if (type === 'returnValue') {
    newNodeText += 'return = ' + data.returnValue
  }

  return newNodeText
}

function replaceOccurrence (string, regex, n, replace) {
  let occ = 0
  return string.replace(regex, match => {
    occ += 1
    if (occ % n === 0) return replace
    return match
   })
}

function cleanupOutputNodeText (text) {
  let dataToOutput = text.replaceAll('\\n', '#92;n')
  dataToOutput = dataToOutput.replaceAll(' ', '&nbsp;')
  dataToOutput = dataToOutput.replaceAll('"', '#quot;')
  return dataToOutput
}

function getNodeTextMermaid (type, data) {
  let newNodeText = '"'
  if (type === 'start') {
    newNodeText += '<strong>Start</strong>'
  } else if (type === 'end') {
    newNodeText += '<strong>End</strong>'
  } else if (type === 'expression') {
    for (let i = 0; i < data.expressions.length; i++) {
      const expression = data.expressions[i]
      newNodeText += cleanupExpression(expression)
      if (i < data.expressions.length - 1) newNodeText += '<br/>'
    }
  } else if (type === 'condition') {
    if (data.condition.indexOf('//') === 0) {
      newNodeText += cleanupExpression(data.condition)
    } else newNodeText += '<strong>if</strong> (' + cleanupExpression(data.condition) + ')'
  } else if (type === 'assertion') {
    if (data.condition.indexOf('//') === 0) {
      newNodeText += cleanupExpression(data.condition)
    } else newNodeText += '<strong>assert</strong> (' + cleanupExpression(data.condition) + ')'
  } 
  else if (type === 'loop') {
    if (data.condition.indexOf('//') === 0) {
      newNodeText += cleanupExpression(data.condition)
    } else newNodeText += '<strong>while</strong> (' + cleanupExpression(data.condition) + ')'
  } else if (type === 'loopFor') {
    newNodeText += '<strong>for</strong> ('
    newNodeText += cleanupExpression(data.initialization) + '; '
    newNodeText += cleanupExpression(data.condition) + '; '
    newNodeText += cleanupExpression(data.step) + ')'
  } else if (type === 'output') {
    newNodeText += 'print #quot;'
    let dataToOutput = cleanupOutputNodeText(data.output)
    newNodeText += dataToOutput
    // newNodeText += replaceOccurrence(dataToOutput, /\s/g, 4, '<br/>')
    newNodeText += '#quot;'
  } else if (type === 'returnValue') {
    newNodeText += 'return ' + data.returnValue
  }

  if (newNodeText === '"') newNodeText += ' '
  newNodeText += '"'

  return newNodeText
}

function getNodeHtml (type, data) {
  const nodeText = getNodeText(type, data)
  const nodeHtml = nodeText.replaceAll('\n', '<br/>')
  return nodeHtml
}

function createNewNode (type) {
  
  const newNode = _.cloneDeep(NODES[type])
  newNode.id = ++ID
  
  newNode.parents = []
  newNode.children = { main: -1 }
  newNode.selected = false

  return newNode
}

function getNopNode (parent, type) {
  const newNode = _.cloneDeep(NODES[type])
  newNode.id = ++NOP_ID
  newNode.nopFor = parent.id
  newNode.parents = []
  newNode.children = { main: -1 }
  newNode.selected = false

  return newNode
}

function getNewNode (type, data) {
  if (!NODES[type]) console.error('Not implemented!')

  const newNode = createNewNode(type)
  const result = [ newNode ]

  if (type === 'start') {
    newNode.variables = [{ name: 'params', op: 'write' }]
  } else if (type === 'expression') {
    newNode.expressions = data.expressions
    newNode.variables = data.variables
  } else if (type === 'condition') {
    const closeConditionNode = getNopNode(newNode, 'nop')
    closeConditionNode.parents.push({ id: newNode.id, branch: 'yes' })
    closeConditionNode.parents.push({ id: newNode.id, branch: 'no' })
    newNode.children = {
      yes: closeConditionNode.id,
      no: closeConditionNode.id,
      main: -1
    }

    newNode.condition = data.condition
    newNode.variables = data.variables

    result.push(closeConditionNode)
  } else if(type === 'assertion'){
    newNode.condition = data.condition
    newNode.variables = data.variables
  }
    else if (type === 'loop') {
    const loopRestartNode = getNopNode(newNode, 'nopNoModal')
    const loopEndNode = getNopNode(newNode, 'nop')
    loopRestartNode.parents.push({ id: newNode.id, branch: 'yes' })
    loopRestartNode.children.main = newNode.id

    loopEndNode.parents.push({ id: newNode.id, branch: 'no' })

    newNode.children = {
      yes: loopRestartNode.id,
      no: loopEndNode.id,
      main: -1
    }

    newNode.condition = data.condition
    newNode.variables = data.variables

    result.push(loopRestartNode)
    result.push(loopEndNode)
  } else if (type === 'loopFor') {
    const loopRestartNode = getNopNode(newNode, 'nopNoModal')
    const loopEndNode = getNopNode(newNode, 'nop')
    loopRestartNode.parents.push({ id: newNode.id, branch: 'yes' })
    loopRestartNode.children.main = newNode.id

    loopEndNode.parents.push({ id: newNode.id, branch: 'no' })



    newNode.children = {
      yes: loopRestartNode.id,
      no: loopEndNode.id,
      main: -1
    }

    newNode.initialization = data.initialization
    newNode.condition = data.condition
    newNode.step = data.step
    newNode.variables = data.variables

    result.push(loopRestartNode)
    result.push(loopEndNode)
  } else if (type === 'output') {
    newNode.output = data.output
  } else if (type === 'returnValue') {
    newNode.returnType = data.returnType
    newNode.returnValue = data.returnValue
  }

  return result
}

function updateNodeContents (nodeObj, data) {
  if (nodeObj.type === 'expression') {
    nodeObj.expressions = data.expressions
    nodeObj.variables = data.variables
  } else if (nodeObj.type === 'condition') {
    nodeObj.condition = data.condition
    nodeObj.variables = data.variables
  } else if (nodeObj.type === 'loop') {
    nodeObj.condition = data.condition
    nodeObj.variables = data.variables
  } else if (nodeObj.type === 'loopFor') {
    nodeObj.initialization = data.initialization
    nodeObj.condition = data.condition
    nodeObj.step = data.step
    nodeObj.variables = data.variables
  } else if (nodeObj.type === 'output') {
    nodeObj.output = data.output
  } else if (nodeObj.type === 'returnValue') {
    nodeObj.returnType = data.returnType
    nodeObj.returnValue = data.returnValue
  }

  return nodeObj
}

function hasChildren (node) {
  if (node.nodeType !== 'condition' && node.children.main >= 0) return true
  if (node.nodeType === 'condition' && node.children.yes >= 0) return true
  if (node.nodeType === 'condition' && node.children.no >= 0) return true
  return false
}

function connectGraphs (parent, branch, childGraph, nodes) {
  // >>> Handle previous child, part 1
  // Check if parent had previous child on the same branch
  // Remove that child from the parent's successors but keep it in order to attach it
  // to child graph exit point
  let previousChild = null
  if (parent.children[branch] >= 0) {
    previousChild = _.find(nodes, { id: parent.children[branch] })
    // Remove parent from previous child's parents
    _.remove(previousChild.parents, { id: parent.id, branch: branch })
  }
  // Remove previous child from parent's children
  parent.children[branch] = -1

  // # Previous child disconnected from parent

  // >>> Handle child graph entry point connection to parent
  // Add new parent to child graph entry point
  childGraph.entry.parents.push({ id: parent.id, branch: branch })
  // Add new child to new parent
  parent.children[branch] = childGraph.entry.id

  // # Connection to entry point done

  // >>> Handle previous child, part 2
  if (!_.isNil(previousChild)) {
    // NOTE: child graphs exit points are always "operation" nodes
    // that can only have children on branch "main"

    // Add previous child as children to child graph exit point
    childGraph.exit.children.main = previousChild.id
    previousChild.parents.push({ id: childGraph.exit.id, branch: 'main' })

    // # Connection o exit point done, previous child handled
  }
}

function connectNodes (parent, branch, child, nodes) {
  // Check if parent and child are already connected -> in that case do nothing
  if (parent.children[branch] === child.id) {
    return
  }

  // Check if parent had previous child on the same branch
  let previousChild = null
  if (parent.children[branch] >= 0) {
    previousChild = _.find(nodes, { id: parent.children[branch] })
    // Remove parent from previous child's parents
  _.remove(previousChild.parents, { id: parent.id })
  }
  // Remove previous child from parent's children
  parent.children[branch] = -1

  const childPreviousParents = _.cloneDeep(child.parents)
  // Remove previous parent (same branch) from new child, if present
  _.remove(child.parents, { branch: branch })
  // Add new parent to new child
  child.parents.push({ id: parent.id, branch: branch })

  // Add new child to new parent
  parent.children[branch] = child.id


  if (!_.isNil(previousChild)) {
    if (!hasChildren(child)) {
      // If new child has no children then we can attach any previous child
      // to its "main", "yes" and "no" branches
      if (child.nodeType !== 'condition') {
        connectNodes(child, 'main', previousChild, nodes)
      } else {
        // TO VERIFY, probably best to directly connect both branches
        connectNodes(child, 'yes', previousChild, nodes)
        connectNodes(child, 'no', previousChild, nodes)
      }
    } else {
      // New child has children of its own

    }
  } else {
    // Parent node has no children, this should never happen
  }

  /*
  if (!_.isNil(previousChild)) {
    // console.log('!!! There is a previous child')
    if (child.nodeType !== 'condition') connectNodes(child, 'main', previousChild, nodes)
    // else previousChild.parents = _.filter(previousChild.parents, n => { return n.id !== parent.id })
    else connectNodes(child, 'yes', previousChild, nodes)
  } else if (['end', 'condition'].indexOf(child.nodeType) < 0 && child.children.main < 0) {
    // console.log('!!! New child was attached at the end')
    const endNode = _.find(nodes, n => { return n.nodeType === 'end' })

    if (child.nodeType !== 'condition') connectNodes(child, 'main', endNode, nodes)
    else connectNodes(child, 'yes', endNode, nodes)
  }
  */
}

function severChildConnection (nodeObj, branch, nodes) {
  const childId = _.clone(nodeObj.children[branch])
  const childObj = _.find(nodes, { id: childId })
  _.remove(childObj.parents, { id: nodeObj.id, branch: branch })
  nodeObj.children[branch] = -1
}

function convertToNodeLine (node) {
  let nodeStr = node.id + '=>'
  nodeStr += node.nodeType + ': '
  if (node.type !== 'nopNoModal') {
    if (node.type !== 'nop') {
      // nodeStr += node.id + ') \n'
      nodeStr += getNodeText(node.type, node)
    }
    if (node.selected) nodeStr += '|selected'
    else if (node.type === 'nop') nodeStr += '|nop'
    nodeStr += ':$nodeClickCallback'
  } else {
    nodeStr += ' |nopNoModal'
  }

  nodeStr += '\n'
  return nodeStr
}

function isAncestorOrSame (origin, node, nodes, visited) {
  if (visited.indexOf(origin) >= 0) return false
  visited.push(origin)

  if (origin === node) return true

  const originNode = _.find(nodes, { id: origin })
  for (const parent of originNode.parents) {
    if (isAncestorOrSame(parent.id, node, nodes, visited)) return true
  }

  return false
}

function convertToConnLine (node, nodes) {
  let connStr = ''
  for (const key in node.children) {
    if (_.isNil(node.children[key]) || node.children[key] < 0) continue
    connStr += node.id
    if (key !== 'main') connStr += '('
    if (key !== 'main') connStr += key
    // if (key === 'no' || isAncestorOrSame(node.id, node.children[key], nodes, [])) connStr += 'right'
    // else connStr += 'bottom'
    if (key !== 'main')  connStr += ')'
    if (node.type === 'nopNoModal') connStr += '(left)'
    connStr += '->'
    connStr += node.children[key]
    connStr += '\n'
  }

  return connStr
}

function convertToDiagramStrFlowchartJS (nodes) {
  let nodeStr = ''
  let connStr = ''

  for (const node of nodes) {
    nodeStr += convertToNodeLine(node)
    connStr += convertToConnLine(node, nodes)
  }

  const diagramStr = nodeStr + '\n' + connStr

  return diagramStr
}

function convertToDiagramStrMermaidJS (nodes, clickable) {
  const endNode = _.find(nodes, { type: 'end' })
  let diagramStr = 'flowchart TD\n'
  for (const node of nodes) {
    let nodeStr = node.id
    if (node.nodeType === 'condition') {
      nodeStr += '{{' + getNodeTextMermaid(node.type, node) + '}}'
    } else if (['nop', 'nopNoModal'].indexOf(node.type) >= 0) {
      nodeStr += '[' + getNodeTextMermaid(node.type, node) + ']'
    } else if (['start', 'end'].indexOf(node.type) >= 0) {
      nodeStr += '([' + getNodeTextMermaid(node.type, node) + '])'
    } else {
      nodeStr += '(' + getNodeTextMermaid(node.type, node) + ')'
    }
    if (node.children.main >= 0) {
      let arrow = ' ==> '
      if (node.unreachable) arrow = ' x--x '
      if (node.type === 'returnValue' && node.children.main !== endNode.id) arrow = ' x--x '
      if (node.type === 'nopNoModal') arrow += '|Restart Loop|'

      nodeStr += arrow + node.children.main + '\n'
      diagramStr += nodeStr
      if (node.type === 'returnValue' && node.children.main !== endNode.id) {
        diagramStr += node.id + ' -.-> ' + endNode.id + '\n'
      }
    } else if (node.children.yes >= 0 && node.children.no >= 0) {
      let noStr = ''
      let yesStr = ''
      if (node.type === 'condition') {
        noStr = nodeStr + ' ==> |False| ' + node.children.no + '\n'
        yesStr = nodeStr + ' ==> |True| ' + node.children.yes + '\n'
      } else if (node.type === 'loop') {
        noStr = nodeStr + ' ==> |End Loop| ' + node.children.no + '\n'
        // yesStr = nodeStr + ' ==> |Enter Loop| ' + node.children.yes + '\n'
        yesStr = nodeStr + ' ==> ' + node.children.yes + '\n'
      }

      diagramStr += yesStr
      diagramStr += noStr
    } else diagramStr += nodeStr + '\n'

    if (clickable && ['end', 'nopNoModal'].indexOf(node.type) < 0) diagramStr += 'click ' + node.id + ' nodeClickCallbackMermaid\n'
    if (node.selected) diagramStr += 'class ' + node.id + ' selected\n'
    if (node.unreachable) diagramStr += 'class ' + node.id + ' unreachable\n'
   // if (node.unreachable) TO DO, here I assign the class
    else if (node.type === 'nop') diagramStr += 'class ' + node.id + ' nop\n'
    else if (node.type === 'nopNoModal') diagramStr += 'class ' + node.id + ' nopNoModal\n'
  }

  diagramStr += 'classDef selected stroke-width:5px,stroke: #2001aa\n'
  diagramStr += 'classDef unreachable fill:#262626\n'
  // diagramStr += 'classDef nop fill:#a1f1fc\n'
  diagramStr += 'classDef nopNoModal fill:#000000\n'

  return diagramStr
}

function convertToDiagramStr (nodes, clickable) {
  if (config.renderer === 'flowchartJS') return convertToDiagramStrFlowchartJS(nodes, clickable)
  else if (config.renderer === 'mermaid') return convertToDiagramStrMermaidJS(nodes, clickable)
}

function initialize (reactThis) {
  window.nodeClickCallback = (event, node) => {
    reactThis.selectNode(node.key)
  }
  window.nodeClickCallbackMermaid = (node) => {
    reactThis.selectNode(node)
  }
}

function updateNode (data, allNodes) {
  let nodeObj = _.find(allNodes, { id: data.id })

  // Update node contents
  updateNodeContents(nodeObj, data)

  return allNodes
}

function findAllNodesBetween (start, end, nodes, result) {
  if (result.indexOf(start.id) < 0) result.push(start.id)
  else return result

  if (start.id === end.id) return result
  for (const childType of ['main', 'yes', 'no']) {
    if (!_.isNil(start.children[childType]) && start.children[childType] >= 0) {
      const childNode = _.find(nodes, n => { return n.id === start.children[childType] })
      result = findAllNodesBetween(childNode, end, nodes, result)
    }
  }

  return result
}

function deleteNode (data, allNodes) {
  const nodesToDelete = findAllNodesBetween(data.start, data.end, allNodes, [])
  const startParent = _.find(allNodes, n => { return n.id === data.start.parents[0].id })
  const startParentBranch = data.start.parents[0].branch
  const endChild = _.find(allNodes, n => { return n.id === data.end.children.main })
  startParent.children[startParentBranch] = -1
  _.remove(endChild.parents, n => { return n.id === data.end.id })

  _.remove(allNodes, n => { return nodesToDelete.indexOf(n.id) >= 0})

  const subGraph = {
    entry: endChild,
    exit: endChild
  }
  connectGraphs(startParent, startParentBranch, subGraph, allNodes)
}

function updateBaseId (nodes) {
  let id = 0
  let nopId = 10000
  for (const func in nodes) {
    for (const node of nodes[func]) {
      if (['nop', 'nopNoModal'].indexOf(node.type) < 0 && node.id >= id) id = node.id + 1
      if (['nop', 'nopNoModal'].indexOf(node.type) >= 0 && node.id >= nopId) nopId = node.id + 1
    }
  }

  ID = id
  NOP_ID = nopId
}

function drawFlowCharts (diagramStrings, divName, selectedFunc, adjustHeight) {
  for (const func in diagramStrings) {
    const flowchartId = divName + func
    const flowchartDiv = document.getElementById(flowchartId)
    if (adjustHeight) {
      const height = flowchartDiv.offsetHeight
      if (height > 0) flowchartDiv.style.height = height + 'px'
    }
    flowchartDiv.innerHTML = ''

    const diagramStr = diagramStrings[func]
    if (config.renderer === 'mermaid') {
      if (selectedFunc === '' || func === selectedFunc) {
        const preElement = document.createElement('pre')
        flowchartDiv.append(preElement)
        preElement.classList.add('mermaid')
        preElement.innerHTML = diagramStr
        mermaid.run({ nodes: [ preElement ], suppressErrors: true })
      }
    }
  }
}

function nodeIsUnreachable (node, nodes) {
  if (node.type === 'start') return false
  // After this point every node has at least a parent
  if (node.type === 'end') return false

  let onlyReturnParent = true
  let allParentsUnreachable = true

  for (const parent of node.parents) {
    const parentObj = _.find(nodes, { id: parent.id })
    if (parentObj.type !== 'returnValue') {
      onlyReturnParent = false
      if (!nodeIsUnreachable(parentObj, nodes)) allParentsUnreachable = false
    }
  }

  if (onlyReturnParent || allParentsUnreachable) return true
  return false
}

function markUnreachableNodes (nodes) {
  for (const node of nodes) {
    if (nodeIsUnreachable(node, nodes)) node.unreachable = true
  }
}

const nodesUtils = {
  initialize,
  getNewNode,
  connectNodes,
  connectGraphs,
  convertToDiagramStr,
  severChildConnection,
  updateNode,
  deleteNode,
  getNodeHtml,
  updateBaseId,
  drawFlowCharts,
  markUnreachableNodes
}

export default nodesUtils
