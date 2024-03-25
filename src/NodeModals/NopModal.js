import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { DoorClosed, ExclamationTriangle } from 'react-bootstrap-icons'
import AddChildButtons from './AddChildButtons'

const _ = require('lodash')


class NopModal extends React.Component {
  render () {
    return (
      <Modal show={this.props.show} onHide={this.props.closeCallback} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>
            {!_.isNil(this.props.node) &&
              <span>
                <DoorClosed /> Nodo {this.props.node.id} - Chiusura corpo di {this.props.node.nopFor}
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
            Questo nodo "chiude" il <em>corpo</em> di una istruzione condizionale o di un ciclo. <br />
            Puoi usarlo per aggiungere nodi successori da eseguire <strong>dopo</strong> la fine dell'istruzione condizionale (indipendentemente dal ramo scelto) o del ciclo.
        </Modal.Body>

        <Modal.Footer>
          {!_.isNil(this.props.node) &&
            <div>
              <h3>Aggiungi nodo successore:</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='main' />
            </div>
          }

        {!_.isNil(this.props.node) && this.props.node.unreachable &&
          <span className='text-danger'><ExclamationTriangle /> Questo nodo non è raggiungibile dal flusso di esecuzione.</span>
        }
        </Modal.Footer>
      </Modal>
    )
  }
}

NopModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  addChildCallback: PropTypes.func
}

export default NopModal
