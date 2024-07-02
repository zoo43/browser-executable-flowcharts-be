import pymongo
import datetime
import pytz
from datetime import datetime, timezone, timedelta





def removeSpaces(s):
    s = s.replace("\n" , "")
    s = s.replace("&nbsp;<br/>","")
    s = s.replace("&nbsp;","")
    return s

def saveData(data, exDbName):
    #print(exDbName)
    client = pymongo.MongoClient("http://contabile.e-fermi.it:11400")
    db = client["Experiment-Data"]
    exercises = db[exDbName]
    collection = db["Homework"] #Will be lesson number
    if(data["studentId"] != "admin"):
        data["timestamp"] = datetime.today() 
        collection.insert_one(data)
    else:
        if(data["type"] == "execution"):
            if(data["output"] != ""):
                #print(data)
                exercises.insert_one(data)
    



