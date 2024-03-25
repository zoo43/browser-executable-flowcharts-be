import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { ArrowRepeat, Plus, Pencil, Trash, ExclamationTriangle, CheckLg } from 'react-bootstrap-icons'
import AddChildButtons from './AddChildButtons'

const _ = require('lodash')
const utils = require('../utils')

const baseState = {
  // Parent nodes
  selectedParents: null,
  disabledParents: null,
  currentlySelectedParents: [],

  // Condition
  initialization: '',
  condition: '',
  step: '',
  parseErrors: {
    initialization: false,
    condition: false,
    step: false
  },
  okToAddNode: false,
  usedVariables: []
}

const codeTextStyle = {
  fontFamily: 'monospace',
  fontSize: '15px',
  height: '100%',
  display: 'inline-block'
}

class LoopForModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateInitialization = this.updateInitialization.bind(this)
    this.updateCondition = this.updateCondition.bind(this)
    this.updateStep = this.updateStep.bind(this)
    this.validate = this.validate.bind(this)
    this.selectParents = this.selectParents.bind(this)
    this.addNode = this.addNode.bind(this)
    this.updateNode = this.updateNode.bind(this)
    this.deleteNode = this.deleteNode.bind(this)
    this.showVariableFeedback = this.showVariableFeedback.bind(this)
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

    let initialization = ''
    let condition = ''
    let step = ''
    let usedVariables = []
    if (!_.isNil(this.props.node)) {
      initialization = this.props.node.initialization
      condition = this.props.node.condition
      step = this.props.node.step

      const parseRes = utils.parseCondition(this.state.condition)
      usedVariables = parseRes.usedVariables
    }

    newState.initialization = initialization
    newState.condition = condition
    newState.step = step
    newState.usedVariables = usedVariables

    this.setState(newState, this.showVariableFeedback)
  }

  updateInitialization (ev) {
    const parseErrors = this.state.parseErrors
    const parsed = utils.parseExpression(ev.target.value)
    if (parsed.parseError) parseErrors.initialization = true
    else parseErrors.initialization = false

    this.setState({
      initialization: ev.target.value,
      parseErrors
    }, this.validate)
  }

  updateCondition (ev) {
    const parseErrors = this.state.parseErrors
    const parsed = utils.parseCondition(ev.target.value)
    if (parsed.parseError) parseErrors.condition = true
    else parseErrors.condition = false

    this.setState({
      condition: ev.target.value,
      parseErrors
    }, this.validate)
  }

  updateStep (ev) {
    const parseErrors = this.state.parseErrors
    const parsed = utils.parseExpression(ev.target.value)
    if (parsed.parseError) parseErrors.step = true
    else parseErrors.step = false

    this.setState({
      step: ev.target.value,
      parseErrors
    }, this.validate)
  }

  validate () {
    let okToGo = true

    const parseInitialization = utils.parseExpression(this.state.initialization)
    const parseCondition = utils.parseCondition(this.state.condition)
    const parseStep = utils.parseExpression(this.state.step)

    if (this.state.initialization === '') okToGo = false
    if (this.state.condition === '') okToGo = false
    if (this.state.step === '') okToGo = false

    if (parseInitialization.parseError) okToGo = false
    if (parseCondition.parseError) okToGo = false
    if (parseStep.parseError) okToGo = false

    const usedVariables = []
    for (const v of parseInitialization.usedVariables) {
      if (!_.isNil(_.find(usedVariables, { name: v.name, op: v.op }))) usedVariables.push(v)
    }
    for (const v of parseCondition.usedVariables) {
      if (!_.isNil(_.find(usedVariables, { name: v.name, op: v.op }))) usedVariables.push(v)
    }
    for (const v of parseStep.usedVariables) {
      if (!_.isNil(_.find(usedVariables, { name: v.name, op: v.op }))) usedVariables.push(v)
    }

    this.setState({
      okToAddNode: okToGo,
      usedVariables: usedVariables
    }, this.showVariableFeedback)
  }

  showVariableFeedback () {
    const usedVariables = this.state.usedVariables
  }

  selectParents (selectedParents) {
    this.setState(utils.selectParents(this.props.node, this.props.nodes, selectedParents), this.validate)
  }

  addNode () {
    const data = {
      parents: _.clone(this.state.currentlySelectedParents),
      initialization: _.cloneDeep(this.state.initialization),
      condition: _.cloneDeep(this.state.condition),
      step: _.cloneDeep(this.state.step),
      variables: _.cloneDeep(this.state.usedVariables)
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      initialization: _.cloneDeep(this.state.initialization),
      condition: _.cloneDeep(this.state.condition),
      step: _.cloneDeep(this.state.step),
    }

    this.props.updateNodeCallback(data, () => { return this.props.closeCallback(true) })
  }

  deleteNode () {
    const endNode = _.find(this.props.nodes, n => { return n.type === 'nop' && n.nopFor === this.props.node.id })
    const data = {
      start: this.props.node,
      end: endNode
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
                <ArrowRepeat /> Nodo {this.props.node.id} - Ciclo For
              </span>
            }
            {_.isNil(this.props.node) &&
              <span>
                <ArrowRepeat /> Nuovo nodo - Ciclo For
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col className='flowchartInfoDiv'>
              Per definire un ciclo <strong>for</strong> inserire:
              <ul>
                <li>Una <strong>inizializzazione</strong> (es: <strong>i = 0</strong>) {this.state.initialization.length > 0 && !this.state.parseErrors.initialization && <CheckLg />}</li>
                <li>Una <strong>condizione</strong> per rimanere nel ciclo (es: <strong>i &lt; 10</strong>) {this.state.condition.length > 0 && !this.state.parseErrors.condition && <CheckLg />}</li>
                <li>Un <strong>passo</strong> (es: <strong>i++</strong>) {this.state.step.length > 0 && !this.state.parseErrors.step && <CheckLg />}</li>
              </ul>
            </Col>
          </Row>
          <Row style={{ marginTop: '20px' }}>
            <Col xs='1'></Col>

            <Col xs='1' style={{ padding: '0px' }}>
              <h3>for (</h3>
            </Col>

            <Col xs='3'>
              <Form.Control
                placeholder="inizializzazione"
                value={this.state.initialization}
                onChange={this.updateInitialization}
                isInvalid={this.state.parseErrors.initialization}
              />
            </Col>

            <Col xs='3'>
              <Form.Control
                placeholder="condizione"
                value={this.state.condition}
                onChange={this.updateCondition}
                isInvalid={this.state.parseErrors.condition}
              />
            </Col>

            <Col xs='3'>
              <Form.Control
                placeholder="passo"
                value={this.state.step}
                onChange={this.updateStep}
                isInvalid={this.state.parseErrors.step}
              />
            </Col>

            <Col xs='1'>
              <h3>)</h3>
            </Col>

          </Row>

        </Modal.Body>

        <Modal.Footer>
          {!_.isNil(this.props.node) &&
            <div>
              <h3>Esito <strong>True</strong> -   Aggiungi nodo successore</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='yes' />
              <h3>Esito <strong>False</strong> -   Aggiungi nodo successore</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='no' />
            </div>
          }

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
              <Trash /> Elimina nodo (insieme a tutti i nodi nel suo corpo)
            </Button>
          }

          {!_.isNil(this.props.node) && this.props.node.unreachable &&
            <span className='text-danger'><ExclamationTriangle /> Questo nodo non è raggiungibile dal flusso di esecuzione.</span>
          }
        </Modal.Footer>
      </Modal>
    )
  }
}

LoopForModal.propTypes = {
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

export default LoopForModal
