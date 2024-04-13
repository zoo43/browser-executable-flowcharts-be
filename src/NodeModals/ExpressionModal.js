import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { Trash, Calculator, Plus, Pencil, ExclamationTriangle } from 'react-bootstrap-icons'
import AddChildButtons from './AddChildButtons'

const _ = require('lodash')
const utils = require('../utils')

const expressionReplaceRegex = /[;\n]/g

const baseState = {
  // Parent nodes
  selectedParents: null,
  disabledParents: null,
  currentlySelectedParents: [],

  // Expression
  currentExpression: '',
  expressions: [],
  expressionErrors: [],
  okToAddExpression: false,
  okToAddNode: false,
  usedVariables: [],
  variableWarnings: []
}

function cleanupExpressionString (val) {
  const res = _.trimStart(val.replace(expressionReplaceRegex, ''))
  return res
}

class ExpressionModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = _.cloneDeep(baseState)
    this.resetState = this.resetState.bind(this)
    this.updateExpression = this.updateExpression.bind(this)
    this.updateSavedExpression = this.updateSavedExpression.bind(this)
    this.addExpression = this.addExpression.bind(this)
    this.removeExpression = this.removeExpression.bind(this)
    this.validate = this.validate.bind(this)
    this.selectParents = this.selectParents.bind(this)
    this.addNode = this.addNode.bind(this)
    this.updateNode = this.updateNode.bind(this)
    this.deleteNode = this.deleteNode.bind(this)
    this.showVariableFeedback = this.showVariableFeedback.bind(this)
    this.getCurrentVariables = this.getCurrentVariables.bind(this)
  }

  componentDidMount () {
    this.resetState()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.node) {
      // Check if we are adding a child of the same type to a node
      // we are updating
      if (_.isNil(this.props.node)) this.resetState()
    }
  }

  resetState () {
    const newState = _.cloneDeep(baseState)
    // Parent nodes
    utils.assignParentsOnReset(newState, this.props.node, this.props.nodes, this.props.parents)

    let expressions = []
    let expressionErrors = []
    let usedVariables = []

    if (!_.isNil(this.props.node)) {
      expressions = this.props.node.expressions
      for (const expression of expressions) {
        const parseRes = utils.parseExpression(expression)
        if (parseRes.parseError) {
          expressionErrors.push(true)
        } else {
          usedVariables = usedVariables.concat(parseRes.usedVariables)
          expressionErrors.push(false)
        }
      }
    }

    newState.expressions = expressions
    newState.expressionErrors = expressionErrors
    newState.usedVariables = usedVariables

    this.setState(newState)
  }

  updateExpression (ev) {
    let exprValue = cleanupExpressionString(ev.target.value)

    const parseRes = utils.parseExpression(exprValue)

    this.setState({
      currentExpression: exprValue,
      okToAddExpression: (!parseRes.parseError && exprValue.length > 0)
    }, this.validate)
  }

  updateSavedExpression (ev, idx) {
    let exprValue = cleanupExpressionString(ev.target.value)
    const parseRes = utils.parseExpression(exprValue)

    const expressionErrors = this.state.expressionErrors
    const expressions = this.state.expressions

    if (parseRes.parseError) expressionErrors[idx] = true
    else expressionErrors[idx] = false

    expressions[idx] = exprValue

    this.setState({
      expressions,
      expressionErrors
    }, this.validate)
  }

  getCurrentVariables (type) {
    let usedVariables = []
    for (const expression of this.state.expressions) {
      const parseRes = utils.parseExpression(expression)
      for (const variable of parseRes.usedVariables) {
        if (type === '') usedVariables.push(variable)
        else if (variable.op === type) usedVariables.push(variable)
      }
    }
    return usedVariables
  }

  showVariableFeedback () {
    return
    const variablesWrittenElsewhere = utils.getAllWrittenVariables(this.props.nodes)
    const variablesWrittenHere = _.map(this.getCurrentVariables('write'), v => { return v.name })
    const writtenVariables = variablesWrittenElsewhere.concat(variablesWrittenHere)

    const parseRes = utils.parseExpression(this.state.currentExpression)

    let variableWarnings = []
    for (const usedVar of parseRes.usedVariables) {
      if (usedVar.op === 'read' && writtenVariables.indexOf(usedVar.name) < 0) {
        variableWarnings.push(utils.getWarningHtml(usedVar.name, 'readUndefined'))
      }
      if (usedVar.op === 'execute' && this.props.functions.indexOf(usedVar.name) < 0) {
        variableWarnings.push(utils.getWarningHtml(usedVar.name, 'executeUndefined'))
      }
    }

    this.setState({ variableWarnings })
  }

  addExpression () {
    const currentExpression = _.trim(this.state.currentExpression)
    const expressions = this.state.expressions
    const expressionErrors = this.state.expressionErrors
    expressions.push(currentExpression)
    expressionErrors.push(false)


    this.setState({
      currentExpression: '',
      expressions,
      expressionErrors
    }, this.validate)
  }

  removeExpression (idxToRemove) {
    const expressions = this.state.expressions
    const expressionErrors = this.state.expressionErrors
    //To remove it filters all expressions that have different id to the one that we want to remove
    const newExpressions = _.filter(expressions, (v, idx) => { return idx !== idxToRemove})
    const newExpressionErrors = _.filter(expressionErrors, (v, idx) => { return idx !== idxToRemove})

    this.setState({
      expressions: newExpressions,
      expressionErrors: newExpressionErrors
    }, this.validate)
  }

  validate () {
    let okToGo = true

    if (this.state.expressions.length === 0) okToGo = false
    for (const expression of this.state.expressions) {
      const parseRes = utils.parseExpression(expression)
      if (parseRes.parseError) okToGo = false
    }

    this.setState({
      okToAddNode: okToGo
    }, this.showVariableFeedback)
  }

  selectParents (selectedParents) {
    this.setState(utils.selectParents(this.props.node, this.props.nodes, selectedParents), this.validate)
  }

  addNode () {
    const usedVariables = this.getCurrentVariables('')

    const data = {
      parents: _.clone(this.state.currentlySelectedParents),
      expressions: _.cloneDeep(this.state.expressions),
      variables: usedVariables
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      expressions: _.cloneDeep(this.state.expressions)
    }
    console.log("The node with id: " + this.props.node.id + " has " + this.state.expressions.length + " expressions")
    this.props.updateNodeCallback(data, () => { return this.props.closeCallback(true) })
  }

  deleteNode () {
    const data = {
      start: this.props.node,
      end: this.props.node
    }
    this.props.deleteNodeCallback(data, () => { return this.props.closeCallback(true) })
  }

  render () {
    return (
      <Modal show={this.props.show} onHide={this.props.closeCallback} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>
            {!_.isNil(this.props.node) &&
              <span>
                <Calculator /> Nodo {this.props.node.id} - Espressione
              </span>
            }
            {_.isNil(this.props.node) &&
              <span>
                <Calculator /> Nuovo nodo - Espressione
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col xs={12}>
              <h3>Espressioni definite:</h3>
              {this.state.expressions.length === 0 &&
                <Row>
                  <Col className='flowchartInfoDiv'>
                    Non ci sono ancora espressioni definite per questo nodo. <br />
                    Usa il form sottostante per <strong>Aggiungere espressioni al nodo</strong>.
                  </Col>
                </Row>
              }
              {this.state.expressions.map((exp, idx) => {
                return (
                  <Row key={idx} style={{ marginTop: '5px' }}>
                    <Col xs={3}>
                      <Button variant='danger' size='sm' onClick={() => {this.removeExpression(idx)}} style={{ width: '100%', height: '100%' }}>
                        <Trash /> Rimuovi
                      </Button>
                    </Col>
                    <Col xs={9}>
                      <Form.Control
                      value={exp}
                      onChange={ev => { this.updateSavedExpression(ev, idx) }}
                      isInvalid={this.state.expressionErrors[idx]}
                      />
                    </Col>
                  </Row>
                )
              })}
            </Col>
          </Row>
          <hr />

          <Row>
            <h3>Nuova espressione:</h3>
            <Col xs={12}>
              <Form.Control onChange={this.updateExpression} value={this.state.currentExpression} />
            </Col>
          </Row>

          <Row>
            <Col>
            {this.state.variableWarnings.map((warn, idx) => {
              return (
                <div className='flowChartWarningDiv' key={idx} dangerouslySetInnerHTML={{ __html: warn }} />
              )
            })}
            </Col>
          </Row>

          <Row>
            <Col>
              <Button style={{ marginTop: '20px' }} variant='primary' disabled={!this.state.okToAddExpression} onClick={this.addExpression}>
                + Aggiungi espressione al nodo
              </Button>
            </Col>
          </Row>

          {_.isNil(this.props.node) &&
          <Row>
            <Col className='flowchartInfoDiv' style={{ marginTop: '10px' }}>
              Esempi di espressioni:
              <ul>
                <li>
                  <strong>Definizione variabili</strong>: <code>num1 = 3</code>, <code>bool1 = true</code>, <code>str1 = "test"</code>
                </li>
                <li>
                  <strong>Operazioni aritmetiche</strong>: <code>x = y * 3 + z</code>, <code>resto = 5 % 2</code>
                </li>
                <li>
                  <strong>Espressioni Booleane</strong>: <code>res = a && b</code>, <code>res2 = !a && (c || d)</code>
                </li>
                <li>
                  <strong>Operazioni con array</strong>: <code>coll = [2, 5, -1]</code>, <code>primoEl = coll[0]</code>, <code>res = coll[0] / coll[4]</code>
                </li>
              </ul>
            </Col>
          </Row>
          }

        </Modal.Body>

        <Modal.Footer>
          {!_.isNil(this.props.node) &&
            <div>
              <h3>Aggiungi nodo successore:</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='main' />
            </div>
          }

          <ButtonGroup>
            {!_.isNil(this.props.node) &&
              <Button variant='success' disabled={!this.state.okToAddNode} onClick={this.updateNode}>
                <Pencil /> Aggiorna nodo
              </Button>
            }

            {_.isNil(this.props.node) &&
              <Button variant='success' disabled={!this.state.okToAddNode} onClick={this.addNode}>
                <Plus /> Aggiungi nodo
              </Button>
            }

            {!_.isNil(this.props.node) &&
              <Button variant='danger' onClick={this.deleteNode}>
                <Trash /> Elimina nodo
              </Button>
            }
          </ButtonGroup>

          {!_.isNil(this.props.node) && this.props.node.unreachable &&
            <span className='text-danger'><ExclamationTriangle /> Questo nodo non è raggiungibile dal flusso di esecuzione.</span>
          }
        </Modal.Footer>
      </Modal>
    )
  }
}

ExpressionModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  functions: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func,
  deleteNodeCallback: PropTypes.func
}

export default ExpressionModal
