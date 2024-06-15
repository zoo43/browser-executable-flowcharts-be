import pymongo


def checkCredentials(data):
    print("ciao")
    id = data["studentId"]
    password = data["password"]

    client = pymongo.MongoClient("mongodb+srv://matteomartini6:admin@cluster0.jpkdcgi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    db = client["Experiment-Data"]
    users = db["Account"]
    res = users.find_one({'studentId' : id , 'password' : password})

    if res == None: 
        return False
    else:
        return id