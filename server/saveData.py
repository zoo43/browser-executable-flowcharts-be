import pymongo
import datetime
import pytz
from datetime import datetime, timezone, timedelta

#TrainingCheckNodes
#Exercises -> Pre-test
#

exDbName = "TrainingCheckNodes"

def removeSpaces(s):
    s = s.replace("\n" , "")
    s = s.replace("&nbsp;<br/>","")
    s = s.replace("&nbsp;","")
    return s

def saveData(data):
    client = pymongo.MongoClient("mongodb+srv://matteomartini6:admin@cluster0.jpkdcgi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    db = client["Experiment-Data"]
    exercises = db[exDbName]
    collection = db["Collection"] #Will be lesson number
    if(data["studentId"] != "admin"):
        data["timestamp"] = datetime.today() 
        collection.insert_one(data)
        if(data["type"] == "execution"):
            correctOutput = exercises.find_one({'exId' : data['exId']})
            print(data['exId'])
            print(correctOutput)
            print(removeSpaces(correctOutput["output"]))
            print(data)
            print(removeSpaces(data["output"]))
            return (removeSpaces(correctOutput["output"]) == removeSpaces(data["output"]))
    else:
        if(data["type"] == "execution"):
            if(data["output"] != ""):
                print(data)
                exercises.insert_one(data)
    
    #Insert into mongodb
    #record = collection.find_one({'classId': '3A'})#Get one record
    
    #collection.delete_many({})#Delete all the records
    
   # 




