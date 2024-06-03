import pymongo
import datetime
import pytz
from datetime import datetime, timezone, timedelta


def saveData(data):

    client = pymongo.MongoClient("mongodb://localhost:27017")
    db = client["local"]
    collection = db["Collection"]
    data["timestamp"] = datetime.today() 
    #collection.insert_one(data) #Insert into mongodb
    #record = collection.find_one({'classId': '3A'})#Get one record
    
    #collection.delete_many({})#Delete all the records
    
   # 




