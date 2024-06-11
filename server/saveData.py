import pymongo
import datetime
import pytz
from datetime import datetime, timezone, timedelta


def saveData(data):
    client = pymongo.MongoClient("mongodb://localhost:27017")
    db = client["local"]
    if(data["studentId"] != "admin"):
        collection = db["Collection"] #Will be lesson number
        data["timestamp"] = datetime.today() 
        print(data)
        collection.insert_one(data)
    else:
        if(data["type"] == "execution"):
            if(data["output"] != ""):
                collection = db["Exercises"]
                print(data)
                collection.insert_one(data)
    
    #Insert into mongodb
    #record = collection.find_one({'classId': '3A'})#Get one record
    
    #collection.delete_many({})#Delete all the records
    
   # 




