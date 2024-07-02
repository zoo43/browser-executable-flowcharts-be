import pymongo
import json
from flask import jsonify

def getAll(exDbName):
    client = pymongo.MongoClient("http://contabile.e-fermi.it:11400")
    db = client["Experiment-Data"]
    collection = db[exDbName]
    res = collection.find()
    elements = []
    for x in res:
        elements.append(x)
    elements = json.dumps(elements, default=str)
    return elements




   



