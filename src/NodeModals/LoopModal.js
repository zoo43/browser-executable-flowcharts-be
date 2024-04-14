import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { ArrowRepeat, Plus, Pencil, Trash, ExclamationTriangle } from 'react-bootstrap-icons'
import AddChildButtons from './AddChildButtons'

const _ = require('lodash')
const utils = require('../utils')

const baseState = {
  // Parent nodes
  selectedParents: null,
  disabledParents: null,
  currentlySelectedParents: [],

  // Condition
  condition: '',
  okToAddNode: false,
  usedVariables: []
}

function cleanupConditionString (val) {
  const res = _.trimStart(val)
  return res
}

class LoopModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateCondition = this.updateCondition.bind(this)
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

    let condition = ''
    let usedVariables = []
    if (!_.isNil(this.props.node)) {
      condition = this.props.node.condition
      const parseRes = utils.parseCondition(this.state.condition)
      usedVariables = parseRes.usedVariables
    }

    newState.condition = condition
    newState.usedVariables = usedVariables

    this.setState(newState, this.showVariableFeedback)
  }

  updateCondition (ev) {
    const val = cleanupConditionString(ev.target.value)
    this.setState({
      condition: val
    }, this.validate)
  }

  validate () {
    let okToGo = true

    const parseRes = utils.parseCondition(this.state.condition)
    // TODO do something with: parseRes.usedVariables

    if (this.state.condition === '') okToGo = false
    if (parseRes.parseError) okToGo = false

    this.setState({
      okToAddNode: okToGo,
      usedVariables: parseRes.usedVariables
    }, this.showVariableFeedback)
  }

  showVariableFeedback () {
    return
    const usedVariables = this.state.usedVariables
  }

  selectParents (selectedParents) {
    this.setState(utils.selectParents(this.props.node, this.props.nodes, selectedParents), this.validate)
  }

  addNode () {
    const data = {
      parents: _.clone(this.state.currentlySelectedParents),
      condition: _.trim(_.cloneDeep(this.state.condition)),
      variables: _.cloneDeep(this.state.usedVariables)
    }

    this.props.addNewNodeCallback(data) 
    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      condition: _.trim(_.cloneDeep(this.state.condition))
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
                <ArrowRepeat /> Nodo {this.props.node.id} - Ciclo While
              </span>
            }
            {_.isNil(this.props.node) &&
              <span>
                <ArrowRepeat /> Nuovo nodo - Ciclo While
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <h3>Anteprima:</h3>
            <Col style={{ textAlign: 'center' }}>
              <pre style={{ fontFamily: 'monospace'}}>
                <strong>while</strong> ({this.state.condition}) {"{ ... }"}
              </pre>
            </Col>
          </Row>
          <Row>
            <h3>Condizione per rimanere nel ciclo:</h3>
            <Col xs={12}>
              <Form.Control onChange={this.updateCondition} value={this.state.condition} />
            </Col>
          </Row>

        </Modal.Body>

        <Modal.Footer>
          {!_.isNil(this.props.node) &&
            <div>
              <h3>Aggiungi nodo successore (corpo del ciclo)</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='yes' />
              <br/><br/>
              <span className='flowchartInfoDiv'>Per aggiungere un nodo da eseguire <em>dopo la fine</em> del ciclo aggiungere un successore al nodo vuoto a cui punta il ramo <strong>End Loop</strong></span>
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

LoopModal.propTypes = {
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

export default LoopModal
