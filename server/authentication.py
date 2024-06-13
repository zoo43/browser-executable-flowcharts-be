import pymongo


def checkCredentials(data):
    print("ciao")
    id = data["studentId"]
    password = data["password"]

    client = pymongo.MongoClient("mongodb://localhost:27017")
    db = client["local"]
    users = db["Account"]
    res = users.find_one({'studentId' : id , 'password' : password})

    if res == None: 
        return False
    else:
        return id