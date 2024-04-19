from flask import Flask, request, Response
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

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
    return "<p>Hello, World!</p>"

@app.route("/flowchart/getInTouch")#Happens when there are no datas on the exercise
def getInTouch():
    if(request.method == "POST"):
        print(decodeData(request))#["exId'] should be NONE_DATA
        return "success"

@app.route("/flowchart/getExercise",methods=["POST"])
def getExercise(): #use the get exercise id on component did mount
    if(request.method == "POST"):
        print(decodeData(request))#["exId']
        return "success"

@app.route("/flowchart/updateFlowchart",methods=["POST"])
def getFlowchart():
    if(request.method == "POST"):
        print(decodeData(request))#['exId'] ['nodes'] ['functions']
        return "success"

#similar on above but happens on execution 
@app.route("/flowchart/executeFlowchart",methods=["POST"])
def getExecution():
    return getFlowchart()
        
        
