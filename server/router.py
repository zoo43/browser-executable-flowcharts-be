from flask import Flask, request, Response
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)


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

@app.route("/flowchart/updateFlowchart",methods=["POST"])
def getFlowchart():
    if(request.method == "POST"):
        data = request.data.decode()
        print(json.loads(data))#["nodes"])
        

    print("\n")
    return "<p>Hello, World!</p>"