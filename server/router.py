from flask import Flask, request, Response
from flask_cors import CORS
from saveData import saveData
import json

app = Flask(__name__)
CORS(app)


userCount = 0

def decodeData(req):
    return json.loads(request.data.decode())

#Handle cors problems
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = Response()
        res.headers['X-Content-Type-Options'] = '*'
        return res
        

@app.route("/")
def hello_world():
    return "<h1> Hello World </h1>"

@app.route("/flowchart/getInTouch",methods=["POST"])#Happens when there are no datas on the exercise
def getInTouch():
    if(request.method == "POST"):
        print(decodeData(request))#["exId'] should be NONE_DATA
        return "ok"


@app.route("/flowchart/getUserId",methods=["POST"])#Happens when there are no datas on the exercise
def getUserId():
    global userCount
    if(request.method == "POST"):
        userCount += 1
        print("users : " + str(userCount))
        return {"userId" : userCount}


@app.route("/flowchart/getExercise",methods=["POST"])
def getExercise(): #use the get exercise id on component did mount
    if(request.method == "POST"):
        print(decodeData(request))#["exId']
        return "success"

@app.route("/flowchart/updateFlowchart",methods=["POST"])
def getFlowchart():
    if(request.method == "POST"):
      #  print(decodeData(request))#['exId'] ['nodes'] ['functions'] ['userId']
        dataToSend = decodeData(request.data)
        if dataToSend["type"] == "modification": #When I execute the flowchart the platform automatically send a request to updateFlowChart; I filter that
            saveData(dataToSend)
        return "success"

#similar on above but happens on execution 
@app.route("/flowchart/executeFlowchart",methods=["POST"])
def getExecution():
   # saveFile(decodeData(request))
    if(request.method == "POST"):
        saveData(decodeData(request.data))
        return getFlowchart()
        
        
