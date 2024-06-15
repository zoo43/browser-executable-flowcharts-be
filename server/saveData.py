import pymongo
import datetime
import pytz
from datetime import datetime, timezone, timedelta

def removeSpaces(s):
    s = s.replace("\n" , "")
    s = s.replace("&nbsp;<br/>","")
    s = s.replace("&nbsp;","")
    return s

def saveData(data):
    client = pymongo.MongoClient("mongodb://localhost:27017")
    db = client["local"]

    exercises = db["Exercises"]
    collection = db["Collection"] #Will be lesson number
    if(data["studentId"] != "admin"):
        data["timestamp"] = datetime.today() 
       # print(data)
        collection.insert_one(data)
        if(data["type"] == "execution"):
            correctOutput = exercises.find_one({'exId' : '0'})
            print(removeSpaces(correctOutput["output"]))
            print(removeSpaces(data["output"]))
            return (removeSpaces(correctOutput["output"]) == removeSpaces(data["output"]))
    else:
        if(data["type"] == "execution"):
            if(data["output"] != ""):
               # print(data)
                exercises.insert_one(data)
    
    #Insert into mongodb
    #record = collection.find_one({'classId': '3A'})#Get one record
    
    #collection.delete_many({})#Delete all the records
    
   # 




