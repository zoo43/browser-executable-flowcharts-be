import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import React from 'react'


class CheckCorrectNodesModal extends React.Component {
    constructor (props) {
      super(props)
    }

    componentDidMount () {}
    render(){
        return (
            <Modal.Dialog> 
            <Modal.Header closeButton> 
              <Modal.Title> 
               Sample Modal Heading 
              </Modal.Title> 
            </Modal.Header> 
            <Modal.Body> 
              <p> 
               This is the sample text for our Modal 
              </p> 
            </Modal.Body> 
            <Modal.Footer> 
              <Button variant="primary"> 
               Save changes 
              </Button> 
              <Button variant="secondary"> 
               Close 
              </Button> 
            </Modal.Footer> 
          </Modal.Dialog> 
        )
    }
}

export default CheckCorrectNodesModal