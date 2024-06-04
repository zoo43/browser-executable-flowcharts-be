import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import { ArrowLeft, ArrowRight } from 'react-bootstrap-icons'
import nodesUtils from './nodes'

const _ = require('lodash')
const utils = require('./utils')

class MemoryStates extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      currentState: -1,
      diagrams: [],
      nodes: this.props.nodes
    }

    this.goToState = this.goToState.bind(this)
    this.goToPreviousState = this.goToPreviousState.bind(this)
    this.goToNextState = this.goToNextState.bind(this)
    this.drawFlowCharts = this.drawFlowCharts.bind(this)
  }

  componentDidMount () {
    this.goToState(0)
  }

  componentDidUpdate (prevProps) {
    //Try to assign prevPros to a variable and then use that to confront.
    //In alternative you can check on prevProps and how to pass parameters to componentDidUpdate
    console.log(prevProps.memoryStates)
    console.log(this.props.memoryStates)
    if ((!_.isEqual(prevProps.memoryStates, this.props.memoryStates) && this.props.memoryStates.length > 0)) {
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

  goToState (idx) {
    const currentState = this.props.memoryStates[idx]

    const diagrams = []
    for (const openFunc of currentState.callOrder) {
      const nodes = _.cloneDeep(this.props.nodes[openFunc.func])
      const highlightNode = currentState.onNode[openFunc.func][openFunc.lvl]

      const presence = _.find(nodes, n => { return highlightNode === n.id})
      if (typeof(presence) !== "undefined")
      {
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
      else
      {
        alert("Attenzione, hai appena cancellato o modificato un nodo senza eseguire il flowchart, la visualizzazione del menù passo-passo non sarà corretta prima di una nuova esecuzione")
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
              {this.state.currentState >= 0 &&
                <div dangerouslySetInnerHTML={{ __html: utils.translateMemoryStateToHtml(this.props.memoryStates[this.state.currentState]) }}></div>
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
