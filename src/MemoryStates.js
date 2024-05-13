import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import { ArrowLeft, ArrowRight } from 'react-bootstrap-icons'
import nodesUtils from './nodes'
import { MultiSelect } from "react-multi-select-component"

const _ = require('lodash')
const utils = require('./utils')


class MemoryStates extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      currentState: -1,
      diagrams: [],
      filter: [],
      options:[]
    }

    this.goToState = this.goToState.bind(this)
    this.goToPreviousState = this.goToPreviousState.bind(this)
    this.goToNextState = this.goToNextState.bind(this)
    this.drawFlowCharts = this.drawFlowCharts.bind(this)
    this.filterMemory = this.filterMemory.bind(this)
    this.filteredMemoryStates = _.cloneDeep(this.props.memoryStates)
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
    
    const variables = this.getVariablesName(idx)
    this.setState({
      currentState: idx,
      options:variables,
      diagrams
    }, this.drawFlowCharts)

    
  }

  drawFlowCharts () {
    const diagrams = {}
    for (const diagramIdx in this.state.diagrams) diagrams[diagramIdx] = this.state.diagrams[diagramIdx].str
    nodesUtils.drawFlowCharts(diagrams, 'diagramDiv', '', true)
  }


  getVariablesName(idx)
  {
    let variablesName = []
    const currentState = idx//Start is -1
    let cont = 1
    for(const [func, functionMemory] of Object.entries(this.props.memoryStates[currentState].memory))
    {
      variablesName.push({"label":func , "value":cont, disabled:true})
      cont++
      for (const stringToAdd in functionMemory[0])
      { 
        if (typeof(functionMemory[0][stringToAdd]) !== 'function')
        {
          variablesName.push({"label":func + " : "+stringToAdd, "value":cont}) //id is not used, but in the future may be useful
          cont++
        }
      }      
    }
    return variablesName
  }

  filterMemory(ev)
  {
    this.filteredMemoryStates = _.cloneDeep(this.props.memoryStates) //I restore the old variables to apply the new filter
    let filter = []
    if(ev.length!==0)
    {
      filter = ev.map((x) => ({"value":x["value"].split(":")[1].trim(" "), "func" : x["value"].split(":")[0].trim(" ")}))
      for (const memoryStateIndex in this.filteredMemoryStates) //for each state in the memory, With that I can change the state and still see the filter)
      {
        for(const [func,functionMemory] of Object.entries(this.filteredMemoryStates[memoryStateIndex].memory))
        {
          if( functionMemory.length > 0 ) //This is for the case that in a function there are no variables
          {
            const oldVars = functionMemory[0] // Think on what to do on different levels
            functionMemory[0] = {} //I empty the filtered memory to add the new Variables that pass the filter
            for(const [variableName,variableValue] of Object.entries(oldVars))
            {
              filter.forEach((element) => { //for each element of the filter
                if(variableName=== element["value"] && func === element["func"])
                  functionMemory[0][variableName] = variableValue
              }) 
            }
          }
        }
      }

    }

    this.setState(
      {
        filter:filter
      } 
    )
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

              <MultiSelect
                options={this.state.options}
                labelledBy="Select"
                disableSearch
              />

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
