const _ = require('lodash')
const acorn = require('acorn')
const acornOptions = require('./acornOptions')
const forbiddenIdentifiers = require('./forbiddenIdentifiers')

function getParentNodeData (nodeId) {
  const res = {
    id: '',
    branch: 'main'
  }

  if (nodeId.toString().indexOf('/') >= 0) {
    const info = nodeId.split('/')
    res.id = parseInt(info[0])
    res.branch = info[1]
  } else res.id = nodeId

  return res
}

function getNodeConnections (nodes, nodeId) {
  const connections = []
  for (const node of nodes) {
    if (!_.isNil(nodeId) && nodeId === node.id) continue
    if (node.nodeType === 'end') continue

    if (node.nodeType === 'condition') {
      connections.push({
        value: node.id + '/yes'
      })
      connections.push({
        value: node.id + '/no'
      })
    } else {
      connections.push({
        value: node.id.toString()
      })
    }
  }

  return connections
}

function directDescendant (id1, id2, nodes) {
  const node1 = _.find(nodes, { id: parseInt(id1) })
  const node2 = _.find(nodes, { id: parseInt(id2) })

  // A node is not a direct descendant of itself
  if (node1.id === node2.id) return false

  for (const parent of node1.parents) {
    if (parent.id === id2 || directDescendant(parent.id, id2, nodes)) return true
  }

  return false
}

function directSuccessor (id1, id2, nodes) {
  const node1 = _.find(nodes, { id: parseInt(id1) })
  const node2 = _.find(nodes, { id: parseInt(id2) })

  if (node1.id === node2.id) return false

  if (node1.children.main < 0) return false

  if (node1.children.main === id2) return true

  return directSuccessor(node1.children.main, id2, nodes)
}

function getDisabledParents (node, nodes, potentialParents) {
  const disabledParents = {}
  const currentlyConnectedParents = []

  for (const conn in potentialParents) {
    let connNodeId = conn
    if (conn.indexOf('/') >= 0) connNodeId = conn.split('/')[0]

    if (potentialParents[conn]) {
      currentlyConnectedParents.push(connNodeId)
    }
  }

  for (const conn in potentialParents) {
    let disabled = false
    let connNodeId = conn
    if (conn.indexOf('/') >= 0) connNodeId = conn.split('/')[0]

    for (const ccp of currentlyConnectedParents) {
      const dirDesc = directDescendant(parseInt(ccp), parseInt(connNodeId), nodes)
      const dirSuc = directSuccessor(parseInt(ccp), parseInt(connNodeId), nodes)
      if (dirDesc || dirSuc) disabled = true
    }

    disabledParents[conn] = disabled
  }

  return disabledParents
}

function getSelectedAndDisabledParents (node, nodes, parents) {
  const selectedParents = {}
  const currentlySelectedParents = []

  for (const conn of getNodeConnections(nodes)) {
    let parentId = -1
    let branch = 'main'
    if (conn.value.indexOf('/') >= 0) {
      parentId = parseInt(conn.value.split('/')[0])
      branch = conn.value.split('/')[1]
    } else parentId = parseInt(conn.value)

    if (_.isNil(parents)) {
      selectedParents[conn.value] = false
    } else {
      const parentObj = _.find(parents, p => { return !_.isNil(p) && !_.isNil(p.node) && (p.node.id === parentId) })
      if (_.isNil(parentObj) || (parentObj.branch !== branch)) {
        selectedParents[conn.value] = false
      } else {
        selectedParents[conn.value] = true
        currentlySelectedParents.push({ id: parentId, branch: branch })
      }
    }
  }
  const disabledParents = getDisabledParents(node, nodes, selectedParents)

  return {
    selectedParents,
    disabledParents,
    currentlySelectedParents
  }
}

function selectParents (node, nodes, selectedParents) {
  const currentlySelectedParents = []
  for (const parent in selectedParents) {
    const newParent = {
      id: parseInt(parent),
      branch: 'main'
    }
    if (parent.indexOf('/') >= 0) {
      newParent.id = parseInt(parent.split('/')[0])
      newParent.branch = parent.split('/')[1]
    }
    if (selectedParents[parent]) currentlySelectedParents.push(newParent)
  }
  const disabledParents = getDisabledParents(node, nodes, selectedParents)

  return {
    selectedParents,
    disabledParents,
    currentlySelectedParents
  }
}

function assignParentsOnReset (state, node, nodes, parents) {
  const sdParents = getSelectedAndDisabledParents(node, nodes, parents)
  state.selectedParents = sdParents.selectedParents
  state.disabledParents = sdParents.disabledParents
  state.currentlySelectedParents = sdParents.currentlySelectedParents
}

function checkIfSameParents (oldParents, newParents) {
  if (oldParents.length !== newParents.length) return false
  for (const parent of oldParents) {
    if (_.isNil(_.find(newParents, { id: parent.id }))) return false
  }

  return true
}

function checkIfOnlyAddingParents (oldParents, newParents) {
  const oldParentsIds = _.map(oldParents, p => { return p.id })
  const newParentsIds = _.map(newParents, p => { return p.id })

  for (const pId of oldParentsIds) {
    if (newParentsIds.indexOf(pId) < 0) return false
  }

  return true
}

function translateMemoryStateToHtml (memoryState) {
  let htmlStr = ''
  for (const func in memoryState.memory) {
    htmlStr += '<strong> --- ' + func + ' --- </strong><br/>'
    htmlStr += '<p style="font-family=monospace;">'
    for (let i = 0; i < memoryState.memory[func].length; i++) {
      const layer = memoryState.memory[func][i]
      if (i > 0) htmlStr += '>> Ricorsione: ' + i + '<br/>'
      for (const varName in layer) {
        if (typeof layer[varName] === 'function') continue
        let varType = 'int'
        if (typeof layer[varName] === 'boolean') varType = 'bool'
        else if (Array.isArray(layer[varName])) varType = 'collection'
        // Highlight variables updated in this memory state
        if (memoryState.updatedVariables[func][i].indexOf(varName) >= 0) htmlStr += '<strong>'
        htmlStr += varName + '&nbsp;=&nbsp;' + getVariableStringRepresentation(varType, layer[varName])
        if (memoryState.updatedVariables[func][i].indexOf(varName) >= 0) htmlStr += '</strong>'
        htmlStr += '<br/>'
      }
    }
    htmlStr += '</p><hr/>'
  }
  return htmlStr
}

function getVariableStringRepresentation (type, value) {
  if (type === 'collection') return JSON.stringify(value)
  else return value
}

const varNameValidateRegex = /^[a-zA-Z][a-zA-Z\d]*$/
const forbiddenNames = ['new', 'var', 'const', 'let', 'function', 'window', 'document', 'cookie']

function validateVariableOrFunctionName (name) {
  if (name === '') return true

  if (
      varNameValidateRegex.test(name) &&
      forbiddenNames.indexOf(name) < 0
    ) return true
  return false
}

function getDefinedFunctions (nodes) {
  const functionNames = _.keys(nodes)
  _.remove(functionNames, n => { return n === 'main' })
  return functionNames
}

function getAllIdentifiersFromExpression (expression, type) {
  let result = []
  if (expression.type === 'Identifier') result.push({ name: expression.name, op: type })
  if (expression.left) {
    let opType = 'read'
    if (expression.type === 'AssignmentExpression') opType = 'write'
    result = result.concat(getAllIdentifiersFromExpression(expression.left, opType))
  }
  if (expression.right) {
    result = result.concat(getAllIdentifiersFromExpression(expression.right, 'read'))
  }
  if (expression.callee) {
    result = result.concat(getAllIdentifiersFromExpression(expression.callee, 'execute'))
  }
  if (expression.arguments) {
    for (const argument of expression.arguments) {
      result = result.concat(getAllIdentifiersFromExpression(argument, 'read'))
    }
  }
  return result
}

function validateIdentifierName (identifier) {
  // Handle identifier blacklist
  if (forbiddenIdentifiers.indexOf(identifier.name) >= 0) return false
  return true
}

const expressionTypesWhitelist = [
  'Identifier', 'Literal', 'ExpressionStatement',
  'LogicalExpression', 'BinaryExpression', 'UnaryExpression',
  'CallExpression', 'AssignmentExpression', 'ArrayExpression',
  'MemberExpression', 'UpdateExpression'
]

function validateParsedExpression (expression) {
  // Do not allow member expressions (access to methods, properties, ecc.)
  if (expressionTypesWhitelist.indexOf(expression.type) < 0) throw Error('Attempt to use forbidden expression type')
  if (expression.type === 'Identifier') validateIdentifierName(expression)

  if (!_.isNil(expression.expression)) validateParsedExpression(expression.expression)
  if (!_.isNil(expression.left)) validateParsedExpression(expression.left)
  if (!_.isNil(expression.right)) validateParsedExpression(expression.right)
  if (!_.isNil(expression.callee)) validateParsedExpression(expression.callee)
  if (!_.isNil(expression.object)) validateParsedExpression(expression.object)
  if (!_.isNil(expression.property)) validateParsedExpression(expression.property)
  if (!_.isNil(expression.arguments)) {
    for (const argument of expression.arguments) {
      validateParsedExpression(argument)
    }
  }
}

function validateParsedScript (script) {
  // Only accept exactly one statement/expression/condition
  if (script.body.length === 0) throw Error('Script has no statements')
  if (script.body.length > 1) throw Error('Script has more than one statement')

  const expression = script.body[0]
  validateParsedExpression(expression)
}

const logicalBinaryOperatorWhitelist = [
  '<', '>', '<=', '>=', '==', '===', '!==', '!='
]

const logicalLiteralWhitelist = [
  'true', 'false'
]

// NB: this does not catch things like: 2 < (true && false)
function verifyLogicalExpression (expression) {
  // console.log(expression)
  // e.g. while ((a && b) || c)
  if (expression.type === 'LogicalExpression') return true
  // e.g. while(!a)
  if (expression.type === 'UnaryExpression') {
    if (expression.operator === '!') return true
  }
  // e.g. while(a)
  if (expression.type === 'Identifier') return true
  // e.g. while(true)
  if (expression.type === 'Literal') {
    if (logicalLiteralWhitelist.indexOf(expression.raw) >= 0) return true
  }
  // e.g. while (a > 2)
  if (expression.type === 'BinaryExpression') {
    if (logicalBinaryOperatorWhitelist.indexOf(expression.operator) >= 0) return true
  }
  // e.g. while (testFun())
  if (expression.type === 'CallExpression') return true

  if (expression.type === 'ExpressionStatement') {
    return verifyLogicalExpression(expression.expression)
  }

  throw Error('Not a logical expression')
}

function parseCondition (script) {
  let parseError = false
  let usedVariables = []
  if (script.indexOf('//') !== 0) {
    try {
      const parsedCondition = acorn.parse(script, acornOptions)
      validateParsedScript(parsedCondition)
  
      const parsedExpr = parsedCondition.body[0].expression
      verifyLogicalExpression(parsedExpr)
  
      usedVariables = getAllIdentifiersFromExpression(parsedExpr, 'read')
    } catch (err) {
      // console.log(err)
      // console.log(err.pos)
      parseError = true
    }
  }

  return {
    usedVariables,
    parseError
  }
}

function parseExpression (script) {
  let parseError = false
  let usedVariables = []
  if (script.indexOf('//') !== 0) {
    try {
      const parsedCondition = acorn.parse(script, acornOptions)
      validateParsedScript(parsedCondition)
  
      const parsedExpr = parsedCondition.body[0].expression
      // verifyLogicalExpression(parsedExpr)
  
      usedVariables = getAllIdentifiersFromExpression(parsedExpr, 'read')
    } catch (err) {
      parseError = true
    }
  }

  return {
    usedVariables,
    parseError
  }
}

function getAllWrittenVariables (nodes) {
  const variables = []
  for (const node of nodes) {
    if (!_.isNil(node.variables)) {
      for (const variable of node.variables) {
        if (variable.op === 'write' && variables.indexOf(variable.name) < 0) variables.push(variable.name)
      }
    }
  }

  return variables
}

function getWarningHtml (varName, reason) {
  let res = ''
  if (reason === 'readUndefined') {
    res += 'Attenzione! La <em>variabile</em> <strong>' + varName + '</strong> non è definita nel programma.'
  } else if (reason === 'executeUndefined') {
    res += 'Attenzione! La <em>funzione</em> <strong>' + varName + '</strong> non è definita nel programma.'
  }

  return res
}

function getFunctionSignature (funName, funParams) {
  if (funName === '') return ''
  let str = funName + '('
  for (let i = 0; i < funParams.length; i++) {
    str += funParams[i]
    if (i < funParams.length - 1) str += ','
  }
  str += ')'

  return str
}

function sanitizeFunctionName (func) {
  let nameToReturn = func
  nameToReturn = nameToReturn.replace(/\(/g, '_')
  nameToReturn = nameToReturn.replace(/\)/g, '_')
  nameToReturn = nameToReturn.replace(/,/g, '_')
  return nameToReturn
}

function translateExpression (expression) {
  if (expression.type === 'Identifier') {
    return 'this["' + expression.name + '"]'
  } else if (expression.type === 'Literal') {
    return expression.raw
  } else if (expression.type === 'MemberExpression') {
    let res = translateExpression(expression.object)
    res += '['
    res += translateExpression(expression.property)
    res += ']'
    return res
  }
  return 'UNPARSED_EXPRESSION'
}

function translateOutputVariable (varName) {
  const parsed = acorn.parse(varName, acornOptions)
  const body = parsed.body[0]
  if (body.type === 'ExpressionStatement') {
    const expression = body.expression
    return translateExpression(expression)
  }
  return 'UNPARSED_VARIABLE'
}

function extractVariableFromScope (scope, path) {
  let res = ''
  try {
    res = function (str) {
      return eval(str)
    }.call(scope, path)
    res = res.toString()
  } catch (err) {
    res = 'undefined'
  }

  return res
}

module.exports = {
  getNodeConnections,
  getParentNodeData,
  getDisabledParents,
  getSelectedAndDisabledParents,
  selectParents,
  assignParentsOnReset,
  checkIfSameParents,
  checkIfOnlyAddingParents,
  translateMemoryStateToHtml,
  getVariableStringRepresentation,
  validateVariableOrFunctionName,
  getDefinedFunctions,
  getAllIdentifiersFromExpression,
  validateParsedScript,
  verifyLogicalExpression,
  parseCondition,
  parseExpression,
  getAllWrittenVariables,
  getWarningHtml,
  getFunctionSignature,
  sanitizeFunctionName,
  translateOutputVariable,
  extractVariableFromScope
}
