import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { Play } from 'react-bootstrap-icons'
import AddChildButtons from './AddChildButtons'

class StartModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    return (
      <Modal show={this.props.show} onHide={this.props.closeCallback} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>
            <Play /> Nodo {this.props.node.id} - Start
          </Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <h3>Aggiungi nodo successore:</h3>
          <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='main' />
        </Modal.Footer>
      </Modal>
    )
  }
}

StartModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  addChildCallback: PropTypes.func
}

export default StartModal
