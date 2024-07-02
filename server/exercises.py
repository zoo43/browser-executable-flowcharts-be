import pymongo
import json
from flask import jsonify

def getAll(exDbName):
    client = pymongo.MongoClient("mongodb+srv://matteomartini6:admin@cluster0.jpkdcgi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    db = client["Experiment-Data"]
    collection = db[exDbName]
    res = collection.find()
    elements = []
    for x in res:
        elements.append(x)
    elements = json.dumps(elements, default=str)
    return elements




   



