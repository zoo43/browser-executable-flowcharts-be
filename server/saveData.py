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
    client = pymongo.MongoClient("mongodb+srv://matteomartini6:admin@cluster0.jpkdcgi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    db = client["Experiment-Data"]
    exercises = db[exDbName]
    collection = db["PostTestCollection"] #Will be lesson number
    if(data["studentId"] != "admin"):
        data["timestamp"] = datetime.today() 
        collection.insert_one(data)
    else:
        if(data["type"] == "execution"):
            if(data["output"] != ""):
                #print(data)
                exercises.insert_one(data)
    



