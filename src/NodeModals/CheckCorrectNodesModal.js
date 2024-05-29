import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'


class CheckCorrectNodesModal extends React.Component {
    constructor (props) {
      super(props)
    }

    componentDidMount () {}
    render(){
        return (
          <Modal show={this.props.show}  size='lg'>
          <Modal.Header closeButton>
            <Modal.Title>
              Hey
            </Modal.Title>
          </Modal.Header>
  
          <Modal.Body>
            <Row>
              <h3>Anteprima:</h3>
              <Col style={{ textAlign: 'center' }}>
              </Col>
            </Row>
            <Row>
              <h3>Output:</h3>
              <Col xs={12}>
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
        </Modal>
        )
    }
}

CheckCorrectNodesModal.propTypes = {
  show: PropTypes.bool
}

export default CheckCorrectNodesModal