const _ = require('lodash')
const acorn = require('acorn')
const parseExpression = require('./parseExpressions')
const utils = require('./utils')
const executer = require('./executer')

const acornOptions = require('./acornOptions')

function testParseExpression (data) {
  const parsed = parseExpression(data.i)
  if (parsed !== data.o) {
    console.log('!!! result', parsed, 'different from expected', data.o)
    return false
  }

  return true
}

const PARSE_EXPRESSION_TESTS = [
  { i: 'a = 1', o: 'this["a"] = 1' },
  { i: 'a = [1, 2, 3]', o: 'this["a"] = [ 1 , 2 , 3 ]' },
  { i: 'a[0] = 1', o: 'this["a"] [ 0 ] = 1' },
  { i: 'a && b', o: 'this["a"] && this["b"]' },
  { i: 'true && false', o: 'true && false' },
  { i: 'prova', o: 'this["prova"]' },
  { i: 'params[0] + params[1]', o: 'this["params"] [ 0 ] + this["params"] [ 1 ]' },
  { i: '1 == 2', o: '1 === 2' },
  { i: 'res = factorial(params[0] - 1)', o: 'this["res"] = this["factorial"] ( this["params"] [ 0 ] - 1 )' },
  { i: 'i != 5', o: 'this["i"] !== 5' },
  { i: 'a = "test"', o: 'this["a"] = "test"' },
  { i: 'i++', o: 'this["i"] ++'},
  { i: 'a+b', o: 'this["a"] + this["b"]'},
  { i: 'a-b', o: 'this["a"] - this["b"]'},
  { i: 'a%b', o: 'this["a"] % this["b"]'},
  { i: 'a*b', o: 'this["a"] * this["b"]'},
  { i: '!a', o: '! this["a"]' },
  { i: 'a += 2', o: 'this["a"] += 2'},
  { i: 'a -= 2', o: 'this["a"] -= 2'},
  { i: '1<2', o: '1 < 2'},
  { i: 'n1<n2', o: 'this["n1"] < this["n2"]' },
  { i: '2>1', o: '2 > 1'},
  { i: 'a = " str "', o: 'this["a"] = " str "'}
]

console.log('>>> Parse expression tests')
for (const test of PARSE_EXPRESSION_TESTS) {
  let str = ''
  if (testParseExpression(test)) {
    str += 'PASSED'
  } else {
    str += 'NOT PASSED'
  }
  str += '    ' + test.i + ' -> ' + test.o
  console.log(str)
}

const LOGICAL_EXPRESSION_VERIFY_TESTS = [
  // VALID
  { i: 'a', e: false },
  { i: 'true', e: false },
  { i: 'false', e: false },
  { i: '!a', e: false },
  { i: 'a && b', e: false },
  { i: 'a && true || false', e: false },
  { i: '(a + b) < 2', e: false },
  { i: '2 > 3', e: false },
  { i: '2 <= 3', e: false },
  { i: '2 >= a', e: false },
  { i: '(true && false) || a && !b', e: false },
  { i: 'testFun()', e: false },
  { i: 'testFun() && true', e: false },
  { i: 'testFun() >= 2', e: false},
  { i: 'a == 2', e: false },
  { i: 'testFun() == 2', e: false },
  // NOT VALID
  { i: '2', e: true },
  { i: '()', e: true },
  { i: '2 - 3', e: true },
  { i: '(a + b)', e: true },
  { i: '2 * 3', e: true },
  { i: 'testFun() + 2', e: true }
]

function testLogicalExpressionVerifier (data) {
  let result = false
  try {
    const parsedCondition = acorn.parse(data.i, acornOptions)
    const parsedExpr = parsedCondition.body[0].expression
    utils.verifyLogicalExpression(parsedExpr)
    if (!data.e) result = true
  } catch (err) {
    if (data.e) result = true
    else result = false
  }

  return result
}

console.log('>>> Test logical expression verifier')
for (const test of LOGICAL_EXPRESSION_VERIFY_TESTS) {
  let str = ''
  if (testLogicalExpressionVerifier(test)) {
    str += 'PASSED'
  } else {
    str += 'NOT PASSED'
  }
  str += '    ' + test.i
  if (test.e) str += '   (is NOT valid)'
  else str += '  (is valid)'
  console.log(str)
}

const PROGRAM_TESTS = [
  {
    i: 'VariableSwap',
    p: {"nodes":{"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":3},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":2,"parents":[{"id":8,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":3,"parents":[{"id":1,"branch":"main"}],"children":{"main":7},"selected":false,"expressions":["v1 = 10","v2 = 5","temp = -1"],"variables":[{"name":"v1","op":"write"},{"name":"v2","op":"write"},{"name":"temp","op":"write"}]},{"type":"expression","nodeType":"operation","id":4,"parents":[{"id":7,"branch":"main"}],"children":{"main":5},"selected":false,"expressions":["temp = v1"],"variables":[{"name":"temp","op":"write"},{"name":"v1","op":"read"}]},{"type":"expression","nodeType":"operation","id":5,"parents":[{"id":4,"branch":"main"}],"children":{"main":6},"selected":false,"expressions":["v1 = v2"],"variables":[{"name":"v1","op":"write"},{"name":"v2","op":"read"}]},{"type":"expression","nodeType":"operation","id":6,"parents":[{"id":5,"branch":"main"}],"children":{"main":8},"selected":false,"expressions":["v2 = temp"],"variables":[{"name":"v2","op":"write"},{"name":"temp","op":"read"}]},{"type":"output","nodeType":"inputoutput","id":7,"parents":[{"id":3,"branch":"main"}],"children":{"main":4},"selected":false,"output":"v1 = $v1; v2 = $v2"},{"type":"output","nodeType":"inputoutput","id":8,"parents":[{"id":6,"branch":"main"}],"children":{"main":2},"selected":false,"output":"v1 = $v1; v2 = $v2"}]},"functions":{"main":{"params":[],"signature":"main"}}},
    s: { main: [{ v1: 5, v2: 10, temp: 10 }] }
  },
  {
    i: 'CartesianCoordinatesInside',
    p: {"nodes":{"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":3},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":2,"parents":[{"id":10003,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":3,"parents":[{"id":1,"branch":"main"}],"children":{"main":4},"selected":false,"expressions":["x1 = 4","y1 = 4","x2 = 10","y2 = 8"],"variables":[{"name":"x1","op":"write"},{"name":"y1","op":"write"},{"name":"x2","op":"write"},{"name":"y2","op":"write"}]},{"type":"expression","nodeType":"operation","id":4,"parents":[{"id":3,"branch":"main"}],"children":{"main":8},"selected":false,"expressions":["px = 7","py = 5"],"variables":[{"name":"px","op":"write"},{"name":"py","op":"write"}]},{"type":"condition","nodeType":"condition","id":5,"parents":[{"id":8,"branch":"main"}],"children":{"yes":6,"no":10001,"main":-1},"selected":false,"condition":"x1 <= px && px <= x2","variables":[{"name":"x1","op":"read"},{"name":"px","op":"read"},{"name":"px","op":"read"},{"name":"x2","op":"read"}]},{"type":"nop","nodeType":"operation","id":10001,"nopFor":5,"parents":[{"id":5,"branch":"no"},{"id":10002,"branch":"main"}],"children":{"main":10},"selected":false},{"type":"condition","nodeType":"condition","id":6,"parents":[{"id":5,"branch":"yes"}],"children":{"yes":9,"no":10002,"main":-1},"selected":false,"condition":"y1 <= py && py <= y2","variables":[{"name":"y1","op":"read"},{"name":"py","op":"read"},{"name":"py","op":"read"},{"name":"y2","op":"read"}]},{"type":"nop","nodeType":"operation","id":10002,"nopFor":6,"parents":[{"id":6,"branch":"no"},{"id":9,"branch":"main"}],"children":{"main":10001},"selected":false},{"type":"expression","nodeType":"operation","id":8,"parents":[{"id":4,"branch":"main"}],"children":{"main":5},"selected":false,"expressions":["inside = false"],"variables":[{"name":"inside","op":"write"}]},{"type":"expression","nodeType":"operation","id":9,"parents":[{"id":6,"branch":"yes"}],"children":{"main":10002},"selected":false,"expressions":["inside = true"],"variables":[{"name":"inside","op":"write"}]},{"type":"condition","nodeType":"condition","id":10,"parents":[{"id":10001,"branch":"main"}],"children":{"yes":11,"no":12,"main":-1},"selected":false,"condition":"inside","variables":[{"name":"inside","op":"read"}]},{"type":"nop","nodeType":"operation","id":10003,"nopFor":10,"parents":[{"id":11,"branch":"main"},{"id":12,"branch":"main"}],"children":{"main":2},"selected":false},{"type":"output","nodeType":"inputoutput","id":11,"parents":[{"id":10,"branch":"yes"}],"children":{"main":10003},"selected":false,"output":"Il punto è dentro al rettangolo"},{"type":"output","nodeType":"inputoutput","id":12,"parents":[{"id":10,"branch":"no"}],"children":{"main":10003},"selected":false,"output":"Il punto è fuori dal rettangolo"}]},"functions":{"main":{"params":[],"signature":"main"}}},
    s: { main: [ { x1: 4, y1: 4, x2: 10, y2: 8, px: 7, py: 5, inside: true } ] }
  },
  {
    i: 'CartesianCoordinatesOutside',
    p: {"nodes":{"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":3},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":2,"parents":[{"id":10003,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":3,"parents":[{"id":1,"branch":"main"}],"children":{"main":4},"selected":false,"expressions":["x1 = 4","y1 = 4","x2 = 10","y2 = 8"],"variables":[{"name":"x1","op":"write"},{"name":"y1","op":"write"},{"name":"x2","op":"write"},{"name":"y2","op":"write"}]},{"type":"expression","nodeType":"operation","id":4,"parents":[{"id":3,"branch":"main"}],"children":{"main":8},"selected":false,"expressions":["px = 7","py = 2"]},{"type":"condition","nodeType":"condition","id":5,"parents":[{"id":8,"branch":"main"}],"children":{"yes":6,"no":10001,"main":-1},"selected":false,"condition":"x1 <= px && px <= x2","variables":[{"name":"x1","op":"read"},{"name":"px","op":"read"},{"name":"px","op":"read"},{"name":"x2","op":"read"}]},{"type":"nop","nodeType":"operation","id":10001,"nopFor":5,"parents":[{"id":5,"branch":"no"},{"id":10002,"branch":"main"}],"children":{"main":10},"selected":false},{"type":"condition","nodeType":"condition","id":6,"parents":[{"id":5,"branch":"yes"}],"children":{"yes":9,"no":10002,"main":-1},"selected":false,"condition":"y1 <= py && py <= y2","variables":[{"name":"y1","op":"read"},{"name":"py","op":"read"},{"name":"py","op":"read"},{"name":"y2","op":"read"}]},{"type":"nop","nodeType":"operation","id":10002,"nopFor":6,"parents":[{"id":6,"branch":"no"},{"id":9,"branch":"main"}],"children":{"main":10001},"selected":false},{"type":"expression","nodeType":"operation","id":8,"parents":[{"id":4,"branch":"main"}],"children":{"main":5},"selected":false,"expressions":["inside = false"],"variables":[{"name":"inside","op":"write"}]},{"type":"expression","nodeType":"operation","id":9,"parents":[{"id":6,"branch":"yes"}],"children":{"main":10002},"selected":false,"expressions":["inside = true"],"variables":[{"name":"inside","op":"write"}]},{"type":"condition","nodeType":"condition","id":10,"parents":[{"id":10001,"branch":"main"}],"children":{"yes":11,"no":12,"main":-1},"selected":false,"condition":"inside","variables":[{"name":"inside","op":"read"}]},{"type":"nop","nodeType":"operation","id":10003,"nopFor":10,"parents":[{"id":11,"branch":"main"},{"id":12,"branch":"main"}],"children":{"main":2},"selected":false},{"type":"output","nodeType":"inputoutput","id":11,"parents":[{"id":10,"branch":"yes"}],"children":{"main":10003},"selected":false,"output":"Il punto è dentro al rettangolo"},{"type":"output","nodeType":"inputoutput","id":12,"parents":[{"id":10,"branch":"no"}],"children":{"main":10003},"selected":false,"output":"Il punto è fuori dal rettangolo"}]},"functions":{"main":{"params":[],"signature":"main"}}},
    s: { main: [ { x1: 4, y1: 4, x2: 10, y2: 8, px: 7, py: 2, inside: false } ] }
  },
  {
    i: 'SumFirstNumbers',
    p: {"nodes":{"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":3},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":2,"parents":[{"id":7,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":3,"parents":[{"id":1,"branch":"main"}],"children":{"main":4},"selected":false,"expressions":["limit = 10","sum = 0","i = 0"],"variables":[{"name":"limit","op":"write"},{"name":"sum","op":"write"},{"name":"i","op":"write"}]},{"type":"loop","nodeType":"condition","id":4,"parents":[{"id":3,"branch":"main"}],"children":{"yes":5,"no":10002,"main":-1},"selected":false,"condition":"i <= limit"},{"type":"nopNoModal","nodeType":"operation","id":10001,"nopFor":4,"parents":[{"id":6,"branch":"main"}],"children":{"main":4},"selected":false},{"type":"nop","nodeType":"operation","id":10002,"nopFor":4,"parents":[{"id":4,"branch":"no"}],"children":{"main":7},"selected":false},{"type":"expression","nodeType":"operation","id":5,"parents":[{"id":4,"branch":"yes"}],"children":{"main":6},"selected":false,"expressions":["sum = sum + i"],"variables":[{"name":"sum","op":"write"},{"name":"sum","op":"read"},{"name":"i","op":"read"}]},{"type":"expression","nodeType":"operation","id":6,"parents":[{"id":5,"branch":"main"}],"children":{"main":10001},"selected":false,"expressions":["i = i + 1"],"variables":[{"name":"i","op":"write"},{"name":"i","op":"read"}]},{"type":"output","nodeType":"inputoutput","id":7,"parents":[{"id":10002,"branch":"main"}],"children":{"main":2},"selected":false,"output":"somma primi $limit numeri = $sum"}]},"functions":{"main":{"params":[],"signature":"main"}}},
    s: { main: [ { limit: 10, sum: 55, i: 11 } ] }
  },
  {
    i: 'FindElement1',
    p: {"nodes":{"main":[{"type":"start","nodeType":"start","id":8,"parents":[],"children":{"main":10},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":9,"parents":[{"id":10006,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":10,"parents":[{"id":8,"branch":"main"}],"children":{"main":11},"selected":false,"expressions":["collection = [1, 5, 3, -1, 10, 7]","numOfElements = 6","elementToFind = 3","i = 0","found = false"]},{"type":"loop","nodeType":"condition","id":11,"parents":[{"id":10,"branch":"main"}],"children":{"yes":12,"no":10004,"main":-1},"selected":false,"condition":"i < numOfElements && !found","variables":[{"name":"i","op":"read"},{"name":"numOfElements","op":"read"}]},{"type":"nopNoModal","nodeType":"operation","id":10003,"nopFor":11,"parents":[{"id":10005,"branch":"main"}],"children":{"main":11},"selected":false},{"type":"nop","nodeType":"operation","id":10004,"nopFor":11,"parents":[{"id":11,"branch":"no"}],"children":{"main":15},"selected":false},{"type":"condition","nodeType":"condition","id":12,"parents":[{"id":11,"branch":"yes"}],"children":{"yes":13,"no":14,"main":-1},"selected":false,"condition":"collection[i] == elementToFind","variables":[{"name":"elementToFind","op":"read"}]},{"type":"nop","nodeType":"operation","id":10005,"nopFor":12,"parents":[{"id":13,"branch":"main"},{"id":14,"branch":"main"}],"children":{"main":10003},"selected":false},{"type":"expression","nodeType":"operation","id":13,"parents":[{"id":12,"branch":"yes"}],"children":{"main":10005},"selected":false,"expressions":["found = true"],"variables":[{"name":"found","op":"write"}]},{"type":"expression","nodeType":"operation","id":14,"parents":[{"id":12,"branch":"no"}],"children":{"main":10005},"selected":false,"expressions":["i = i + 1"],"variables":[{"name":"i","op":"write"},{"name":"i","op":"read"}]},{"type":"condition","nodeType":"condition","id":15,"parents":[{"id":10004,"branch":"main"}],"children":{"yes":16,"no":17,"main":-1},"selected":false,"condition":"found","variables":[{"name":"found","op":"read"}]},{"type":"nop","nodeType":"operation","id":10006,"nopFor":15,"parents":[{"id":16,"branch":"main"},{"id":17,"branch":"main"}],"children":{"main":9},"selected":false},{"type":"output","nodeType":"inputoutput","id":16,"parents":[{"id":15,"branch":"yes"}],"children":{"main":10006},"selected":false,"output":"Elemento $elementToFind trovato alla posizione $i"},{"type":"output","nodeType":"inputoutput","id":17,"parents":[{"id":15,"branch":"no"}],"children":{"main":10006},"selected":false,"output":"Elemento $elmentToFind non trovato"}]},"functions":{"main":{"params":[],"signature":"main"}}},
    s: { main: [{ collection: [1, 5, 3, -1, 10, 7], numOfElements: 6, elementToFind: 3, i: 2, found: true }] }
  },
  {
    i: 'FindElement2',
    p: {"nodes":{"main":[{"type":"start","nodeType":"start","id":8,"parents":[],"children":{"main":10},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":9,"parents":[{"id":10006,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":10,"parents":[{"id":8,"branch":"main"}],"children":{"main":11},"selected":false,"expressions":["collection = [1, 5, 3, -1, 10, 7]","numOfElements = 6","i = 0","found = false","elementToFind = 1000"]},{"type":"loop","nodeType":"condition","id":11,"parents":[{"id":10,"branch":"main"}],"children":{"yes":12,"no":10004,"main":-1},"selected":false,"condition":"i < numOfElements && !found","variables":[{"name":"i","op":"read"},{"name":"numOfElements","op":"read"}]},{"type":"nopNoModal","nodeType":"operation","id":10003,"nopFor":11,"parents":[{"id":10005,"branch":"main"}],"children":{"main":11},"selected":false},{"type":"nop","nodeType":"operation","id":10004,"nopFor":11,"parents":[{"id":11,"branch":"no"}],"children":{"main":15},"selected":false},{"type":"condition","nodeType":"condition","id":12,"parents":[{"id":11,"branch":"yes"}],"children":{"yes":13,"no":14,"main":-1},"selected":false,"condition":"collection[i] == elementToFind","variables":[{"name":"elementToFind","op":"read"}]},{"type":"nop","nodeType":"operation","id":10005,"nopFor":12,"parents":[{"id":13,"branch":"main"},{"id":14,"branch":"main"}],"children":{"main":10003},"selected":false},{"type":"expression","nodeType":"operation","id":13,"parents":[{"id":12,"branch":"yes"}],"children":{"main":10005},"selected":false,"expressions":["found = true"],"variables":[{"name":"found","op":"write"}]},{"type":"expression","nodeType":"operation","id":14,"parents":[{"id":12,"branch":"no"}],"children":{"main":10005},"selected":false,"expressions":["i = i + 1"],"variables":[{"name":"i","op":"write"},{"name":"i","op":"read"}]},{"type":"condition","nodeType":"condition","id":15,"parents":[{"id":10004,"branch":"main"}],"children":{"yes":16,"no":17,"main":-1},"selected":false,"condition":"found","variables":[{"name":"found","op":"read"}]},{"type":"nop","nodeType":"operation","id":10006,"nopFor":15,"parents":[{"id":16,"branch":"main"},{"id":17,"branch":"main"}],"children":{"main":9},"selected":false},{"type":"output","nodeType":"inputoutput","id":16,"parents":[{"id":15,"branch":"yes"}],"children":{"main":10006},"selected":false,"output":"Elemento $elementToFind trovato alla posizione $i"},{"type":"output","nodeType":"inputoutput","id":17,"parents":[{"id":15,"branch":"no"}],"children":{"main":10006},"selected":false,"output":"Elemento $elementToFind non trovato"}]},"functions":{"main":{"params":[],"signature":"main"}}},
    s: { main: [{ collection: [1, 5, 3, -1, 10, 7], numOfElements: 6, elementToFind: 1000, i: 6, found: false }] }
  },
  {
    i: 'GreaterThan1',
    p: {"nodes":{"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":3},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":2,"parents":[{"id":10004,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":3,"parents":[{"id":1,"branch":"main"}],"children":{"main":4},"selected":false,"expressions":["collection = [6, 3, 2, 15, 1]","numOfElements = 5","x = 18","gt = true","i = 0"]},{"type":"loop","nodeType":"condition","id":4,"parents":[{"id":3,"branch":"main"}],"children":{"yes":5,"no":10002,"main":-1},"selected":false,"condition":"i < numOfElements && gt","variables":[{"name":"i","op":"read"},{"name":"numOfElements","op":"read"},{"name":"gt","op":"read"}]},{"type":"nopNoModal","nodeType":"operation","id":10001,"nopFor":4,"parents":[{"id":7,"branch":"main"}],"children":{"main":4},"selected":false},{"type":"nop","nodeType":"operation","id":10002,"nopFor":4,"parents":[{"id":4,"branch":"no"}],"children":{"main":8},"selected":false},{"type":"condition","nodeType":"condition","id":5,"parents":[{"id":4,"branch":"yes"}],"children":{"yes":6,"no":10003,"main":-1},"selected":false,"condition":"collection[i] > x","variables":[{"name":"x","op":"read"}]},{"type":"nop","nodeType":"operation","id":10003,"nopFor":5,"parents":[{"id":6,"branch":"main"},{"id":5,"branch":"no"}],"children":{"main":7},"selected":false},{"type":"expression","nodeType":"operation","id":6,"parents":[{"id":5,"branch":"yes"}],"children":{"main":10003},"selected":false,"expressions":["gt = false"],"variables":[{"name":"gt","op":"write"}]},{"type":"expression","nodeType":"operation","id":7,"parents":[{"id":10003,"branch":"main"}],"children":{"main":10001},"selected":false,"expressions":["i++"],"variables":[]},{"type":"condition","nodeType":"condition","id":8,"parents":[{"id":10002,"branch":"main"}],"children":{"yes":9,"no":11,"main":-1},"selected":false,"condition":"gt","variables":[{"name":"gt","op":"read"}]},{"type":"nop","nodeType":"operation","id":10004,"nopFor":8,"parents":[{"id":9,"branch":"main"},{"id":11,"branch":"main"}],"children":{"main":2},"selected":false},{"type":"output","nodeType":"inputoutput","id":9,"parents":[{"id":8,"branch":"yes"}],"children":{"main":10004},"selected":false,"output":"$x è maggiore di tutti gli elementi della collezione"},{"type":"output","nodeType":"inputoutput","id":11,"parents":[{"id":8,"branch":"no"}],"children":{"main":10004},"selected":false,"output":"$x non è maggiore di tutti gli elementi della collezione"}]},"functions":{"main":{"params":[],"signature":"main"}}},
    s: { main: [ { collection: [6, 3, 2, 15, 1 ], numOfElements: 5, x: 18, gt: true, i: 5 } ]}
  },
  {
    i: 'GreaterThan2',
    p: {"nodes":{"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":3},"selected":false,"variables":[{"name":"params","op":"write"}]},{"type":"end","nodeType":"end","id":2,"parents":[{"id":10004,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":3,"parents":[{"id":1,"branch":"main"}],"children":{"main":4},"selected":false,"expressions":["collection = [6, 3, 2, 15, 1]","numOfElements = 5","x = 13","gt = true","i = 0"]},{"type":"loop","nodeType":"condition","id":4,"parents":[{"id":3,"branch":"main"}],"children":{"yes":5,"no":10002,"main":-1},"selected":false,"condition":"i < numOfElements && gt","variables":[{"name":"i","op":"read"},{"name":"numOfElements","op":"read"},{"name":"gt","op":"read"}]},{"type":"nopNoModal","nodeType":"operation","id":10001,"nopFor":4,"parents":[{"id":7,"branch":"main"}],"children":{"main":4},"selected":false},{"type":"nop","nodeType":"operation","id":10002,"nopFor":4,"parents":[{"id":4,"branch":"no"}],"children":{"main":8},"selected":false},{"type":"condition","nodeType":"condition","id":5,"parents":[{"id":4,"branch":"yes"}],"children":{"yes":6,"no":10003,"main":-1},"selected":false,"condition":"collection[i] > x","variables":[{"name":"x","op":"read"}]},{"type":"nop","nodeType":"operation","id":10003,"nopFor":5,"parents":[{"id":6,"branch":"main"},{"id":5,"branch":"no"}],"children":{"main":7},"selected":false},{"type":"expression","nodeType":"operation","id":6,"parents":[{"id":5,"branch":"yes"}],"children":{"main":10003},"selected":false,"expressions":["gt = false"],"variables":[{"name":"gt","op":"write"}]},{"type":"expression","nodeType":"operation","id":7,"parents":[{"id":10003,"branch":"main"}],"children":{"main":10001},"selected":false,"expressions":["i++"],"variables":[]},{"type":"condition","nodeType":"condition","id":8,"parents":[{"id":10002,"branch":"main"}],"children":{"yes":9,"no":11,"main":-1},"selected":false,"condition":"gt","variables":[{"name":"gt","op":"read"}]},{"type":"nop","nodeType":"operation","id":10004,"nopFor":8,"parents":[{"id":9,"branch":"main"},{"id":11,"branch":"main"}],"children":{"main":2},"selected":false},{"type":"output","nodeType":"inputoutput","id":9,"parents":[{"id":8,"branch":"yes"}],"children":{"main":10004},"selected":false,"output":"$x è maggiore di tutti gli elementi della collezione"},{"type":"output","nodeType":"inputoutput","id":11,"parents":[{"id":8,"branch":"no"}],"children":{"main":10004},"selected":false,"output":"$x non è maggiore di tutti gli elementi della collezione"}]},"functions":{"main":{"params":[],"signature":"main"}}},
    s: { main: [ { collection: [6, 3, 2, 15, 1 ], numOfElements: 5, x: 13, gt: false, i: 4 } ]}
  }
]

console.log('>>> Test programs')
for (const program of PROGRAM_TESTS) {
  let passed = false
  const nodes = program.p.nodes
  const functions = program.p.functions
  const startNode = _.find(nodes.main, { type: 'start' })
  try {
    const res = executer.executeFromNode(
      startNode,
      nodes,
      functions,
      'main',
      executer.getNewCalcData(nodes, functions)
    )

    // console.log(res.scope)
    if (_.isEqual(res.scope, program.s)) passed = true
  } catch (err) {
    error = true
    errorObj = err
  }

  let str = ''
  if (passed) str += 'PASSED'
  else str += 'NOT PASSED'
  str += '    ' + program.i
  console.log(str)
}

console.log('>>>>> Output variable translate tests')

const TRANSLATE_VAR_TESTS = [
  { i: 'v', o: '1', s: { v: 1 } },
  { i: 'v[0]', o: '0', s: { v: [0, 1, 2] } },
  { i: 'v[a]', o: '2', s: { v: [0, 1, 2], a: 2 } },
  { i: 'v1[v2[v3]]', o: 'b', s: { v1: ['a', 'b', 'c'], v2: [0, 1, 2], v3: 1} },
  { i: 'v[1][2]', o: '12', s: { v: [['00', '01', '02'], ['10', '11', '12'], ['20', '21', '22']]}},
  { i: 'v[a][b]', o: '11', s: { v: [['00', '01', '02'], ['10', '11', '12'], ['20', '21', '22']], a: 1, b: 1 }},
  { i: 'v', o: 'undefined', s: { q: 1 } },
  { i: 'v[i]', o: 'undefined', s: { v: [1, 2, 3] } },
  { i: 'v[4]', o: 'undefined', s: { v: [1] }}
]

for (const test of TRANSLATE_VAR_TESTS) {
  const translation = utils.translateOutputVariable(test.i)
  const value = utils.extractVariableFromScope(test.s, translation)
  let str = ''
  if (value !== test.o) str += '!!! FAIL'
  else str += 'PASSED'

  str += '   ' + test.i + ' -> ' + translation + ' -> ' + value
  if (value !== test.o) str += '   (expected: ' + test.o + ')'
  console.log(str)
}

function testExpression (data) {
  const parsed = parseExpression(data.i)

  const result = function (str) {
    return eval(str)
  }.call(data.s, parsed)

  if (!_.isEqual(data.s, data.o)) return { passed: false }
  return { passed:true }
}

const EXPRESSION_TESTS = [
  { i: 's += 1', s: { s: 0 }, o: { s: 1 } },
  { i: 's -= 2', s: { s: 5 }, o: { s: 3 } },
  { i: 's++', s: { s: 5 }, o: { s: 6 } },
  { i: 's--', s: { s: 5 }, o: { s: 4 } },
  { i: 's = 3 - 8', s: { }, o: { s: -5 } },
  { i: 's = 6 / 4', s: { }, o: { s: 1.5 } },
  { i: 's = 6 % 4', s: { }, o: { s: 2 } },

]

console.log('>>>>> TEST EXPRESSIONS')
for (const exprTest of EXPRESSION_TESTS) {
  const res = testExpression(exprTest)
  if (res.passed) console.log('PASSED     ', exprTest.i)
  else {
    console.log('!!!! NOT PASSED ', exprTest.i, 'expected: ', exprTest.o, ' found: ', exprTest.s)
  }

}