import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'

import Dropdown from 'react-bootstrap/Dropdown';
import { ArrowLeft, ArrowRight } from 'react-bootstrap-icons'
import nodesUtils from './nodes'

const _ = require('lodash')
const utils = require('./utils')

class MemoryStates extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      currentState: -1,
      diagrams: []
    }

    this.goToState = this.goToState.bind(this)
    this.goToPreviousState = this.goToPreviousState.bind(this)
    this.goToNextState = this.goToNextState.bind(this)
    this.drawFlowCharts = this.drawFlowCharts.bind(this)
    this.filterMemory = this.filterMemory.bind(this)
    this.removeFilter = this.removeFilter.bind(this)
    this.filteredMemoryStates = _.cloneDeep(this.props.memoryStates)
    this.filter = ""
  }

  componentDidMount () {
    this.goToState(0)
  }

  componentDidUpdate (prevProps) {
    if (!_.isEqual(prevProps.memoryStates, this.props.memoryStates) && this.props.memoryStates.length > 0) {
      this.goToState(0)
    }
  }

  goToPreviousState () {
    const currentState = this.state.currentState
    this.goToState(currentState - 1)
  }

  goToNextState () {
    const currentState = this.state.currentState
    this.goToState(currentState + 1)
  }

  //If I have a filter on, I call this method to shows only the variables that I want to. I Should assign the filter on a var on the event to keep this so that the filter can remain
  goToState (idx) {
    let currentState = this.props.memoryStates[idx]

    const diagrams = []
    
    for (const openFunc of currentState.callOrder) {
      const nodes = _.cloneDeep(this.props.nodes[openFunc.func])
      const highlightNode = currentState.onNode[openFunc.func][openFunc.lvl]
      
      // TODO qui dopo l'esecuzione di End highlightNode diventa undefined
      if (_.isFinite(highlightNode)) {
        _.find(nodes, n => { return n.id === highlightNode }).selected = true

        const nodesStr = nodesUtils.convertToDiagramStr(nodes, false)
        const diagramData = {
          func: openFunc.func,
          lvl: openFunc.lvl,
          str: nodesStr
        }

        diagrams.push(diagramData)
      }
    }

    this.setState({
      currentState: idx,
      diagrams
    }, this.drawFlowCharts)
  }

  drawFlowCharts () {
    const diagrams = {}
    for (const diagramIdx in this.state.diagrams) diagrams[diagramIdx] = this.state.diagrams[diagramIdx].str
    nodesUtils.drawFlowCharts(diagrams, 'diagramDiv', '', true)
  }



  getVariablesName()
  {
    let variablesName = []
    let cont = 1
    const currentState = this.state.currentState===-1? 0 : this.state.currentState
    const state = this.props.memoryStates[currentState].memory['main']
    for (const y in state[0])
    { 
      const stringToAdd = y
      variablesName.push({"id":cont , "name":stringToAdd})
      cont++
    }
    return variablesName
  }

  removeFilter()
  {
    this.filteredMemoryStates = _.cloneDeep(this.props.memoryStates)
    this.filter = ""
    this.setState({
      currentState: this.state.currentState
    })
  }

//TO DO: for all functions
  filterMemory(ev)
  {
    this.filter = ev.target.text.trim(" ")
    this.filteredMemoryStates = _.cloneDeep(this.props.memoryStates)//this to undo eventually previous filters
    for (const x in this.filteredMemoryStates) //for each state in the memory, I filter and remove the vars that are not the filter
    {
      const Oldvars = this.filteredMemoryStates[x].memory['main'][0] // Think on what to do on different levels
      const newVars = Object.keys(Oldvars).filter(variable =>
        variable === this.filter).reduce((newElement, variable) =>
        {
            newElement[variable] = Oldvars[variable];
            return newElement;
        }, {})
      
      this.filteredMemoryStates[x].memory['main'][0] = newVars
    }


    this.setState({
      currentState: this.state.currentState
    })


  }

  render () {
    return (
      <Card style={{ width: '100%' }}>
        <Card.Body>
          <Row>
            <Col xs={3}></Col>
            <Col xs={2}>
              <Button
                style={{ width: '100%' }}
                onClick={this.goToPreviousState}
                disabled={this.state.currentState <= 0}
              >
                <ArrowLeft />
              </Button>
            </Col>
            <Col xs={1}></Col>
            <Col xs={2}>
              <Button
                style={{ width: '100%' }}
                onClick={this.goToNextState}
                disabled={this.state.currentState === (this.props.memoryStates.length - 1)}
              >
                <ArrowRight />
              </Button>
            </Col>
            <Col xs={3}></Col>
          </Row>

          <Row>
            <Col xs={9}>
              <h3>Esecuzione (passo {this.state.currentState + 1}/{this.props.memoryStates.length})</h3>
              <div id='diagramContainer' style={{ overflowX: 'scroll', whiteSpace: 'nowrap' }}>
                {this.state.diagrams.map((diagram, idx) => {
                  return (
                    <div key={idx} style={{display: 'inline-block', textAlign: 'center' }}>
                      <strong>{diagram.func} {diagram.lvl > 0 && '(Ricorsione: ' + diagram.lvl + ')'}</strong>
                      <div id={'diagramDiv' + idx} key={idx}></div>
                    </div>
                  )
                })}
              </div>
            </Col>
            <Col xs={3} style={{ borderLeft: '2px solid black' }}>
              <h3>Memoria</h3>

              <Dropdown>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  Filtro : { this.filter }
                </Dropdown.Toggle>

                <Dropdown.Menu>
                <Dropdown.Item key={0} onClick={this.removeFilter}> Remove Filter </Dropdown.Item>
                  {this.getVariablesName().map((variable) => (
                      <Dropdown.Item key={variable.id} onClick={this.filterMemory}> {variable.name} </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
              </Dropdown>
              {this.state.currentState >= 0 &&
                <div dangerouslySetInnerHTML={{ __html: utils.translateMemoryStateToHtml(this.filteredMemoryStates[this.state.currentState])}}></div>
              }
            </Col>
          </Row>
        </Card.Body>
      </Card>
    )
  }
}

MemoryStates.propTypes = {
  memoryStates: PropTypes.array,
  nodes: PropTypes.object
}

export default MemoryStates
