import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { SignpostSplit, Plus, Pencil, Trash, ExclamationTriangle } from 'react-bootstrap-icons'
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
  usedVariables: [],
  variableWarnings: [],
  checked : false
}

function cleanupConditionString (val) {
  const res = _.trimStart(val)
  return res
}

class ConditionModal extends React.Component {
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
    this.checkNode = this.checkNode.bind(this)
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
    let checked = false
    let condition = ''
    let usedVariables = []
    if (!_.isNil(this.props.node)) {
      checked = this.props.node.checked !==undefined ? this.props.node.checked : false 
      condition = this.props.node.condition
      const parseRes = utils.parseCondition(this.state.condition)
      usedVariables = parseRes.usedVariables
    }
    newState.checked = checked
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

    if (this.state.condition === '') okToGo = false
    if (parseRes.parseError) okToGo = false

    this.setState({
      okToAddNode: okToGo,
      usedVariables: parseRes.usedVariables
    }, this.showVariableFeedback)
  }

  showVariableFeedback () {
    return
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

  checkNode(ev)
  {
    const okToGo = (ev.target.checked !== this.props.node.checked || this.state.okToAddNode)? true : false   
    this.setState({
      okToAddNode: okToGo,
      checked: ev.target.checked
    })
  }

  updateNode () {
    
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      condition: _.trim(_.cloneDeep(this.state.condition)),
      variables: _.cloneDeep(this.state.usedVariables),
      checked : this.state.checked
    }

    this.props.updateNodeCallback(data, () => { return this.props.closeCallback(true) })
  }

  deleteNode () {
    const endNode = _.find(this.props.nodes, n => { return n.nopFor === this.props.node.id })
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
                <SignpostSplit /> Nodo {this.props.node.id} - Condizione
              </span>
            }
            {_.isNil(this.props.node) &&
              <span>
                <SignpostSplit /> Nuovo nodo - Condizione
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <h3>Anteprima:</h3>
            <Col style={{ textAlign: 'center' }}>
              <pre style={{ fontFamily: 'monospace'}}>
                <strong>if</strong> ({this.state.condition}) {"{ ... }"}
              </pre>
            </Col>
          </Row>
          <Row>
            <h3>Condizione:</h3>
            <Col xs={12}>
              <Form.Control onChange={this.updateCondition} value={this.state.condition} />
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

        </Modal.Body>

        <Modal.Footer>
          {!_.isNil(this.props.node) &&
            <div>
              <h3>Esito <strong>True</strong> -  Aggiungi nodo successore</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='yes' />
              <h3>Esito <strong>False</strong> -  Aggiungi nodo successore</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='no' />
            </div>
          }

          {!_.isNil(this.props.node) &&
            <Form.Check className="me-auto d-sm-inline-block" type="checkbox" id="default-checkbox" label="Segna il nodo come corretto" onChange={this.checkNode} checked={this.state.checked}/> 
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
                <Trash /> Elimina nodo (E tutti i nodi nel suo corpo)
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

ConditionModal.propTypes = {
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

export default ConditionModal
