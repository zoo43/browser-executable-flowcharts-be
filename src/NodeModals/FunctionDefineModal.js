import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { Trash, Pencil, Plus } from 'react-bootstrap-icons'
import ButtonGroup from 'react-bootstrap/ButtonGroup'

const _ = require('lodash')
const utils = require('../utils')

const baseState = {
  // Function call
  functionName: '',
  currentParameterName: '',
  currentParameterType: 'Indefinito',
  returnType: 'Indefinito',
  functionParameters: [],
  okToAddNode: false
}

class FunctionDefineModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateFunctionName = this.updateFunctionName.bind(this)
    this.updateCurrentParameterName = this.updateCurrentParameterName.bind(this)
    this.addParameter = this.addParameter.bind(this)
    this.removeParameter = this.removeParameter.bind(this)
    this.validate = this.validate.bind(this)
    this.addFunction = this.addFunction.bind(this)
    this.getFunctionSignature = this.getFunctionSignature.bind(this)
    this.updateCurrentParameterType = this.updateCurrentParameterType.bind(this)
    this.updateNode = this.updateNode.bind(this)
    this.changeReturnType = this.changeReturnType.bind(this)
  }

  componentDidMount () {
    this.resetState()
  }

  resetState () {
    let newState = _.cloneDeep(baseState)
    console.log(this.props)
    if(this.props.modifyFunction) //Here, I have to put things
    {
      newState.functionName = this.props.functionName
      newState.functionParameters = this.props.functionData.params
      newState.correct = this.props.functionData.correct
      newState.returnType = this.props.functionData.returnType
    }
    this.setState(newState)
  }

  updateNode()
  {
    const data = {
      signature : utils.getFunctionSignature(this.state.functionName, this.state.functionParameters),
      functionParameters : this.state.functionParameters,
      correct : this.state.correct,
      returnType: this.state.returnType
    }
    this.props.updateNodeCallback(data, () => { return this.props.closeCallback(true) })
  }

  updateFunctionName (ev) {
    const newFunctionName = ev.target.value.trim()

    if (utils.validateVariableOrFunctionName(newFunctionName)) {
      this.setState({
        functionName: newFunctionName
      }, this.validate)
    }
  }

  updateCurrentParameterName (ev) {
    const newParameterName = ev.target.value.trim()

    if (utils.validateVariableOrFunctionName(newParameterName)) {
      this.setState({
        currentParameterName: newParameterName
      }, this.validate)
    }
  }

  addParameter () {
    const parameters = this.state.functionParameters
    if (parameters.indexOf(this.state.currentParameterName) < 0) {
      parameters.push({"name":this.state.currentParameterName,"type":this.state.currentParameterType})
      this.setState({
        functionParameters: parameters,
        currentParameterName: ''
      }, this.validate)
    }
  }

  removeParameter (idx) {
    const parameters = this.state.functionParameters
    parameters.splice(idx, 1)
    this.setState({
      functionParameters: parameters
    }, this.validate)
  }

  getFunctionSignature () {
    const functionName = this.state.functionName
    const functionParameters = this.state.functionParameters
    const functionSignature = utils.getFunctionSignature(functionName, functionParameters)
    return functionSignature
  }

  validate () {
    let okToAddNode = true
    if (this.state.functionName === '') okToAddNode = false

    this.setState({
      okToAddNode
    })
  }

  addFunction () {
    const data = {
      parents: _.clone(this.state.currentlySelectedParents),
      functionName: _.cloneDeep(this.state.functionName),
      functionParameters: _.cloneDeep(this.state.functionParameters),
      returnType: _.cloneDeep(this.state.returnType),
      assignReturnValTo: _.cloneDeep(this.state.assignReturnValTo)
    }

    this.props.addFunctionCallback(data)

    this.props.closeCallback()
  }

  updateCurrentParameterType(ev){
    this.setState({
      currentParameterType: ev.target.value
    })
  }

  changeReturnType(ev)
  {
    this.setState({
      returnType: ev.target.value,
    }, this.validate)
  }



  render () {
    return (
      <Modal show={this.props.show} onHide={this.props.closeCallback} size='xl'>
        <Modal.Header closeButton>
          <Modal.Title>
            Aggiungi funzione al programma
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={12} style={{ textAlign: 'center' }}>
              <h3>{this.getFunctionSignature()}</h3>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Form.Label>Parametri:</Form.Label>
              <ul>
                {this.state.functionParameters.map((param, idx) => {
                  return (
                    <li key={idx}>
                      {param.name} , {param.type}&nbsp;&nbsp;&nbsp;<Button variant='danger' onClick={() => { this.removeParameter(idx) }} size='sm'><Trash /></Button>
                    </li>
                  )
                })}
              </ul>
            </Col>
          </Row>
          <hr />
          <Row>
            <Col xs={6}>
              <Form.Label>Nome della funzione:</Form.Label>
              <Form.Control value={this.state.functionName} onChange={this.updateFunctionName}/>
            </Col>
          </Row>
          <hr />
          
          <Form.Label>Nuovo parametro:</Form.Label>
          <Row>
            <Col xs={4}>
              <Form.Control value={this.state.currentParameterName} onChange={this.updateCurrentParameterName}/>
            </Col>
            
            <Col xs={4}>
            <Form.Select onChange={this.updateCurrentParameterType}>
              <option>Indefinito</option>
              <option>Numero</option>
              <option>Stringa</option>
              <option>Bool</option>
              <option>Array</option>
            </Form.Select>
              
            </Col>
            
            <Col xs={4}>
              <Button variant='primary' disabled={this.state.currentParameterName === ''} onClick={this.addParameter}>
                Aggiungi parametro
              </Button>
            </Col>
          </Row>
          <hr />
          <Form.Label>Inserisci vincoli sul ritorno:</Form.Label>
          <Row>
            
            <Col xs={8}>
            <Form.Select onChange={this.changeReturnType} value={this.state.returnType}>
              <option>Indefinito</option>
              <option>Numero</option>
              <option>Stringa</option>
              <option>Bool</option>
              <option>Array</option>
            </Form.Select>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <ButtonGroup>
          {!(this.props.modifyFunction)  &&
            <Button variant='success' disabled={!this.state.okToAddNode} onClick={this.addFunction}>
              Aggiungi
            </Button>
          }

          {(this.props.modifyFunction) &&
            
              <Button variant='success' disabled={!this.state.okToAddNode} onClick={this.updateNode}>
                <Pencil /> Aggiorna
              </Button>            
          }
          </ButtonGroup>
        </Modal.Footer>
      </Modal>
    )
  }
}

FunctionDefineModal.propTypes = {
  show: PropTypes.bool,
  functionData: PropTypes.object,
  closeCallback: PropTypes.func,
  addFunctionCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default FunctionDefineModal