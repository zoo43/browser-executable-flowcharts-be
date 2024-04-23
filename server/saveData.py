import os
import glob
import pymongo


def saveData(data):
    client = pymongo.MongoClient( "mongodb+srv://matteomartini6:4ioPQXy5ba67qqUd@cluster0.jpkdcgi.mongodb.net/?retryWrites=true&w=majority")
    dbName = client["Experiment-Data"]
    collection = dbName["Collection"]
    #collection.insert_one(data) Insert into mongodb



#db.inventory.delete_many({}) Delete all the records
