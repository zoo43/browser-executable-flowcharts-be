import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Table from 'react-bootstrap/Table'
import { Trash, Pencil } from 'react-bootstrap-icons'
import ButtonGroup from 'react-bootstrap/ButtonGroup'

const _ = require('lodash')
const utils = require('../utils')

const baseState = {
  // Function call
  functionName: '',
  currentParameterName: '',
  currentParameterType: 'Indefinito',
  functionParameters: [],
  okToAddNode: false,
  unitTests: []
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
    this.updateTable = this.updateTable.bind(this)
  }

  componentDidMount () {
    this.resetState()
  }


  createDefaultUnitTest()
  {
    if(this.state.functionParameters !== 0)
    {
      let cont = 0
      const defaultTests = this.props.functionData.params.map( (param, id) =>
      { cont = id
        return {
          id : id.toString(),
          name : param.name, //name is column name
          value : ""
        }
      })

      cont = cont + 1
      defaultTests.push({
        id:cont.toString(),
        name : "Ritorno", //name is column name
        value : ""
      })
      return defaultTests
    }
  }

  removeParameterFromTest(idx)
  {
    let newUnitTests = _.cloneDeep(this.state.unitTests)
    for(const x in newUnitTests)
    {
      const res = newUnitTests[x].findIndex((element) =>
      {      
        return element.id === idx.toString()
      })
      console.log(res)
      newUnitTests[x].splice(res, 1)
    }
    
    console.log(newUnitTests)
    return newUnitTests
  }
  
  findMaxId(arr)
  {
    const ids = arr.map((a) => a.id)
    const maxId = Math.max(...ids)
    return maxId
  }

  addParameterToTest()
  {
    const newUnitTests = _.cloneDeep(this.state.unitTests)   
    for(const x in newUnitTests)
    {
      const newId = this.findMaxId(newUnitTests[x])
      const returnElement = newUnitTests[x].pop()
      newUnitTests[x].push(
      {
        id : newId.toString(),
        name : this.state.currentParameterName,
        value : ""
      })
      returnElement.id = (newUnitTests[x].length).toString()
      newUnitTests[x].push(returnElement)
    }
    return newUnitTests
  }

  resetState () {
    let newState = _.cloneDeep(baseState)
    if(this.props.modifyFunction)
    {
      newState.functionName = this.props.functionName
      newState.functionParameters = this.props.functionData.params
      newState.correct = this.props.functionData.corret
      if(!_.isNil(this.props.functionData.unitTests))
        newState.unitTests = this.props.functionData.unitTests
      else
        newState.unitTests[0]=this.createDefaultUnitTest()
    }
    
    this.setState(newState)
  }

  updateNode()
  {
    const data = {
      name : this.state.functionName,
      signature : utils.getFunctionSignature(this.state.functionName, this.state.functionParameters),
      functionParameters : this.state.functionParameters,
      correct : this.state.correct,
      unitTests : this.state.unitTests
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
      const newUnitTests = this.addParameterToTest()
      this.setState({
        functionParameters: parameters,
        currentParameterName: '',
        unitTests : newUnitTests
      }, this.validate)
    }
  }

  removeParameter (idx) {
    const parameters = this.state.functionParameters
    const newUnitTests = this.removeParameterFromTest(idx)
    parameters.splice(idx, 1)
    this.setState({
      functionParameters: parameters,
      unitTests : newUnitTests
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



  updateTable(ev)
  {
    const newUnitTests = _.cloneDeep(this.state.unitTests)
    const row = ev.target.name.split("-")[0]
    const col = ev.target.name.split("-")[1]
    newUnitTests[row][col].value = ev.target.value
    this.setState({unitTests : newUnitTests},this.validate)
    
    
  }

  createTableHeaders()
  { 
    const rows = this.state.functionParameters.map((param,id) => {
      return (<th> { param.name } </th>)
    })
    rows.push((<th> {"Ritorno"} </th>))
    return [rows]
  }


  createRows()
  {
    const rows = []
    for(const x in this.state.unitTests)
    {
      const row = this.state.unitTests[x].map((param,id) => {
        return (<td> <Form.Control key={id} name={x + "-" + id} id={id} value={param.value} onChange={this.updateTable} /></td>)
      })
      rows.push(row)
    }
    
    return(<tr>{rows}</tr>)  
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
          {this.state.functionParameters.length !==0 && this.props.modifyFunction && //check if there are parameters
          <>
            <Form.Label>Inserisci test d'unità </Form.Label>
            <Row>
            <Table striped bordered hover>
              <thead>
                <tr>
                  {
                    this.createTableHeaders()
                  }
                </tr>
              </thead>
              <tbody>
                {
                  this.createRows()
                }
              </tbody>
            </Table>  
            </Row>
            <Button  variant='primary'>
                Aggiungi riga alla tabella
            </Button>
            </>
          }

        </Modal.Body>

        <Modal.Footer>
          <ButtonGroup>
          {!this.props.modifyFunction &&
            <Button variant='success' disabled={!this.state.okToAddNode} onClick={this.addFunction}>
              Aggiungi
            </Button>
          }

          {this.props.modifyFunction &&
            
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
  updateNodeCallback: PropTypes.func,
  modifyFunction: PropTypes.bool
}

export default FunctionDefineModal