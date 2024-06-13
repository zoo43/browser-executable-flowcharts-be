from flask import Flask, request, Response
from flask_cors import CORS
from saveData import saveData
from exercises import getAll
from flask_jwt_extended import create_access_token,get_jwt,get_jwt_identity, \
                               unset_jwt_cookies, jwt_required, JWTManager
import json
from datetime import datetime, timedelta, timezone
from authentication import checkCredentials

app = Flask(__name__)
CORS(app)


userCount = 0



app.config["JWT_SECRET_KEY"] = "please-remember-to-change-me"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(app)



@app.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json()
            if type(data) is dict:
                data["access_token"] = access_token 
                response.data = json.dumps(data)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original respone
        return response


@app.route('/token', methods=["POST"])
def create_token():
    id = decodeData(request)["studentId"]
    response = {}
    res = checkCredentials(decodeData(request))
    access_token = create_access_token(identity=id)
    response["access_token"] = access_token
    if(res != False):
        response["studentId"] = res
        return response, 200
    else:
        return "Wrong credentials" , 401




def decodeData(req):
    return json.loads(req.data.decode())

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
@jwt_required() 
def getInTouch():
    if(request.method == "POST"):
        print(decodeData(request))#["exId'] should be NONE_DATA
        return "ok"


@app.route("/flowchart/getUserId",methods=["POST"])#Happens when there are no datas on the exercise
@jwt_required() 
def getUserId():
    global userCount
    if(request.method == "POST"):
        userCount += 1
        print("users : " + str(userCount))
        return {"userId" : userCount}




@app.route("/flowchart/getExercise",methods=["POST"])
@jwt_required() 
def getExercise(): #use the get exercise id on component did mount
    if(request.method == "POST"):
        return "success"

@app.route("/flowchart/updateFlowchart",methods=["POST"])
@jwt_required() 
def getFlowchart():
    if(request.method == "POST"):
      #  print(decodeData(request))#['exId'] ['nodes'] ['functions'] ['userId']
        dataToSend = decodeData(request)
        saveData(dataToSend)
        return "success"

@app.route("/flowchart/getExercises", methods = ["GET"])
@jwt_required() 
def getAllExercises():
    if(request.method == "GET"):
        exercises = getAll()
        print(exercises)
        return exercises

#similar on above but happens on execution 
@app.route("/flowchart/executeFlowchart",methods=["POST"])
@jwt_required() 
def getExecution():
   # saveFile(decodeData(request))
    if(request.method == "POST"):
        res = saveData(decodeData(request))
        s = "Il programma è corretto" if res else "Il programma non è corretto"
        return s
        
        
