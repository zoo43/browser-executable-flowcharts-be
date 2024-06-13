import React from 'react'
import Flow from './Flow'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import comm from './communications'


class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = { studentId:'' , password:'', logged:false}
    this.checkCredentials = this.checkCredentials.bind(this)
    this.changePassword = this.changePassword.bind(this)
    this.changeId = this.changeId.bind(this)
    
  }

  componentDidMount () {
    const id = window.sessionStorage.getItem("accessToken")
    const studentId = window.sessionStorage.getItem("studentId")
    if (id !== null && studentId !== null)
    {
      this.setState(
        {
          logged : true,
          studentId : studentId
        }
      )
    }
  }

  changePassword(ev)
  {
    this.setState({
      password : ev.target.value
    })
  }

  changeId(ev)
  {
    this.setState({
      studentId : ev.target.value
    })
  }


  checkCredentials(){
    //Before check if it's logged
    comm.login(this.state.studentId, this.state.password, () => {
      this.setState({
        logged:true
      })
      window.location.reload()
    })
   // window.sessionStorage.setItem("studentId",this.state.studentId)
  }

  render(){
    return(
    <>
    {this.state.logged && 
      <div style={{ width: '100%' }}>
      <Flow
          studentId = {this.state.studentId}
      />
      </div>
    }

    {!this.state.logged &&
    <div className="flex m-5 p-5">
      <Form>
        <h1 className="text-center">Schermata di accesso</h1>
      <Form.Group className="mx-auto p-2" style = {{width:400}} controlId="userId">
        <Form.Label>Id Utente</Form.Label>
        <Form.Control className="mx-2" type="text" onChange={this.changeId} placeholder="Inserisci il tuo id utente" />
      </Form.Group>
  
      <Form.Group className="mx-auto p-2" style = {{width:400}}  controlId="password">
        <Form.Label>Password</Form.Label>
        <Form.Control className="mx-2" type="password" onChange={this.changePassword} placeholder="Password" />
      </Form.Group>
        <div className="pt-5 text-center" >
          <Button  onClick={this.checkCredentials} variant="primary" style = {{height:60, width:120}}type="button">
            Entra
          </Button>
        </div>
      </Form>
    </div>
    }
  </>)}
}
/*
  render () {
    return (
      <div style={{ width: '100%' }}>
        <Flow />
      </div>
    )
  }
}*/

export default App



