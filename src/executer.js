const _ = require('lodash')
const utils = require('./utils')
const parseExpressions = require('./parseExpressions')

const outputVariableRegex = /\$([a-zA-Z]+[a-zA-Z\d_]*(\[[a-zA-Z\d_]*\])*)/g

function getExecutableFunction (calcData, otherFunc, nodes, functions) {
  return (...args) => {
    const newScope = {
      // params: _.cloneDeep(args)
    }

    for (let i = 0; i < functions[otherFunc].params.length; i++) {
      const param = functions[otherFunc].params[i]
      if (i <= args.length) {
        newScope[param] = args[i]
      } else newScope[param] = undefined
    }

    for (const func in nodes) {
      if (func === 'main') continue
      newScope[func] = getExecutableFunction(calcData, func, nodes, functions)
    }
    calcData.scope[otherFunc].push(newScope)
    const funcStartNode = _.find(nodes[otherFunc], n => { return n.type === 'start' })
    executeFromNode(funcStartNode, nodes, functions, otherFunc, calcData)
    const res = _.cloneDeep(calcData.returnVal[otherFunc])

    // "Consume" the return value
    calcData.returnVal[otherFunc] = null

    // Delete parameters
    calcData.scope[otherFunc].pop()
    return res
  }
}

function getNewCalcData (nodes, functions) {
  const calcData = { scope: {}, outputs: [], memoryStates: [], returnVal: {}, onNode: {}, callOrder: [] }
  for (const func in nodes) {
    calcData.scope[func] = []
    calcData.onNode[func] = []
    calcData.returnVal[func] = null
    if (func !== 'main') continue

    calcData.scope[func].push({})
    for (const otherFunc in nodes) {
      if (otherFunc === 'main') continue

      calcData.scope[func][0][otherFunc] = getExecutableFunction(calcData, otherFunc, nodes, functions)
    }
  }

  return calcData
}

function findUpdatedVariables (previousStates, currentState) {
  const updatedVariables = {}
  for (const func in currentState.memory) {
    updatedVariables[func] = []
    for (let i = 0; i < currentState.memory[func].length; i++) {
      updatedVariables[func].push([])
      for (const variable in currentState.memory[func][i]) {
        if (
          previousStates.length === 0 ||
          previousStates[previousStates.length - 1].memory[func].length <= i ||
          _.isNil(previousStates[previousStates.length - 1].memory[func][i][variable]) ||
          !_.isEqual(previousStates[previousStates.length - 1].memory[func][i][variable], currentState.memory[func][i][variable])
          ) updatedVariables[func][i].push(variable)
      }
    }
  }

  return updatedVariables
}

function executeFromNode (node, nodes, functions, func, calcData) {
  const currentFunc = calcData.scope[func].length - 1

  if (calcData.callOrder.length === 0) {
    calcData.callOrder.push({ func, lvl: currentFunc })
  } else {
    const lastCall = calcData.callOrder[calcData.callOrder.length - 1]
    if (lastCall.func !== func || lastCall.lvl < currentFunc) {
      calcData.callOrder.push({ func, lvl: currentFunc })
    }
  }
  calcData.onNode[func].push(node.id)
  let nextNode
  if (node.type !== 'end') {
    nextNode = _.find(nodes[func], { id: node.children.main })
  }

  if (node.type === 'variable') {
    for (const variable of node.variables) {
      calcData.scope[func][currentFunc][variable.name] = variable.value
    }
  } else if (node.type === 'expression') {
    for (const expr of node.expressions) {
      // Skip comment expressions
      if (expr.indexOf('//') === 0) continue

      const parsedExpr = parseExpressions(expr)

      const result = function (str) {
        return eval(str)
      }.call(calcData.scope[func][currentFunc], parsedExpr)
      // const lastCall = calcData.callOrder[calcData.callOrder.length - 1]
      // if (lastCall.func !== func || lastCall.lvl < currentFunc) {
      //  calcData.callOrder.push({ func, lvl: currentFunc })
      // }
    }

  } else if (node.type === 'condition' || node.type === 'loop') {
    // const condition = booleanExpression(node.condition)
    // const parsedCondition = condition.toString(cleanupUserInput)
    const parsedCondition = parseExpressions(node.condition)

    const result = function (str) {
      return eval(str)
    }.call(calcData.scope[func][currentFunc], parsedCondition)

    if (result) nextNode = _.find(nodes[func], { id: node.children.yes })
    else nextNode = _.find(nodes[func], { id: node.children.no })
  } else if (node.type === 'output') {
    const matchedVariables = {}
    let match

    do {
      match = outputVariableRegex.exec(node.output)
      if (match) {
          // TODO handle missing variables
          const translation = utils.translateOutputVariable(match[1])
          const value = utils.extractVariableFromScope(calcData.scope[func][currentFunc], translation)
          matchedVariables[match[0]] = value
      }
    } while (match)

    let outputStr = node.output
    for (const keyVar in matchedVariables) {
      outputStr = outputStr.replaceAll(keyVar, matchedVariables[keyVar])
    }
    calcData.outputs.push({ func, str: outputStr })
  } else if (node.type === 'returnValue') {
    const returnType = node.returnType
    let returnValue = node.returnValue
    if (returnType === 'variableName') {
      returnValue = _.cloneDeep(calcData.scope[func][currentFunc][returnValue])
    }
    calcData.returnVal[func] = returnValue

    // Jump to end node
    nextNode = _.find(nodes[func], { type: 'end' })
  }

  if (['nop', 'nopNoModal'].indexOf(node.type) < 0) {
    const memoryStateSnapshot = {
      id: _.clone(node.id),
      type: _.clone(node.type),
      func: func,
      recursionDepth: currentFunc,
      onNode: _.cloneDeep(calcData.onNode),
      memory: _.cloneDeep(calcData.scope),
      callOrder: _.cloneDeep(calcData.callOrder)
    }

    memoryStateSnapshot.updatedVariables = findUpdatedVariables(calcData.memoryStates, memoryStateSnapshot)

    calcData.memoryStates.push(memoryStateSnapshot)
  }

  calcData.onNode[func].pop()

  if (node.type === 'end') {
    calcData.callOrder.pop()
    return calcData
  } else return executeFromNode(nextNode, nodes, functions, func, calcData)
}

module.exports = {
  getNewCalcData,
  executeFromNode
}
