import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { Printer, Plus, Pencil, Trash, ExclamationTriangle } from 'react-bootstrap-icons'
import AddChildButtons from './AddChildButtons'

const _ = require('lodash')
const utils = require('../utils')

const baseState = {
  // Parent nodes
  selectedParents: null,
  disabledParents: null,
  currentlySelectedParents: [],

  // Output
  output: '',
  okToAddNode: false
}

class OutputModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateOutput = this.updateOutput.bind(this)
    this.validate = this.validate.bind(this)
    this.selectParents = this.selectParents.bind(this)
    this.addNode = this.addNode.bind(this)
    this.updateNode = this.updateNode.bind(this)
    this.deleteNode = this.deleteNode.bind(this)
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

    let output = ''
    if (!_.isNil(this.props.node)) {
      output = this.props.node.output
    }

    newState.output = output

    this.setState(newState)
  }

  updateOutput (ev) {
    this.setState({
      output: ev.target.value
    }, this.validate)
  }

  validate () {
    let okToGo = true
    // TODO should parse and validate output here probably
    if (this.state.output === '') okToGo = false

    this.setState({
      okToAddNode: okToGo
    })
  }

  selectParents (selectedParents) {
    this.setState(utils.selectParents(this.props.node, this.props.nodes, selectedParents), this.validate)
  }

  addNode () {
    const data = {
      parents: _.clone(this.state.currentlySelectedParents),
      output: _.cloneDeep(this.state.output)
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      output: _.cloneDeep(this.state.output)
    }

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
                <Printer /> Nodo {this.props.node.id} - Output
              </span>
            }
            {_.isNil(this.props.node) &&
              <span>
                <Printer /> Nuovo nodo - Output
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <h3>Anteprima:</h3>
            <Col style={{ textAlign: 'center' }}>
              <pre style={{ fontFamily: 'monospace'}}>
                print &quot;{this.state.output}&quot;
              </pre>
            </Col>
          </Row>
          <Row>
            <h3>Output:</h3>
            <Col xs={12}>
              <Form.Control onChange={this.updateOutput} value={this.state.output} />
              <Form.Text muted>
                Per stampare il valore di una variabile usare il nome della variabile preceduto da <strong>$</strong>, ad esempio: <strong>$n</strong>, <strong>$array1[n]</strong>, ...
              </Form.Text>
              <br />
              <Form.Text muted>
                Per fare andare a capo il testo usare <strong>\n</strong>
              </Form.Text>
            </Col>
          </Row>

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

OutputModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default OutputModal
