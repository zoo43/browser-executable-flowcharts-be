import os
import glob
import pymongo


def saveData(data):

    client = pymongo.MongoClient("mongodb://localhost:27017")
    dbName = client["local"]
    collection = dbName["Collection"]
   # collection.insert_one(data) #Insert into mongodb



#db.inventory.delete_many({}) Delete all the records
