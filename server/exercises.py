import pymongo
import json
from flask import jsonify

def getAll():
    client = pymongo.MongoClient("mongodb://localhost:27017")
    db = client["local"]
    collection = db["Exercises"]
    res = collection.find()
    elements = []
    for x in res:
        elements.append(x)
    elements = json.dumps(elements, default=str)
    return elements




   



