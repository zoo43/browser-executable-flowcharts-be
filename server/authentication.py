import pymongo


def checkCredentials(data):
   # print("ciao")
    id = data["studentId"]
    password = data["password"]

    client = pymongo.MongoClient("http://contabile.e-fermi.it:11400")
    db = client["Experiment-Data"]
    users = db["Account"]
   # print(id)
   # print(password)
    res = users.find_one({'userId' : id , 'password' : password})

    if res == None: 
        return False
    else:
        return id