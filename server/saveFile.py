import os
import glob

def checkIfDirectoryExist(path):
    if not os.path.exists(path):
        os.mkdir(path)

def writeOnFile(path, content):
    f = open(path,"w")
    f.write(content)
    f.close()

#type can be "modifications" or "executions"
def saveFile(data, type):
    exId = data['exId']
    exId = "4" #da togliere
    userId = data['userId']

    del data['userId']
    del data['exId']

    path = f'files/class/' + userId  + "/" + exId+ "/"+ type
    accumulator = ""
    for directory in path.split("/"):
        accumulator += directory + "/"
        checkIfDirectoryExist(accumulator)

    lastFileCounter = 1
    lastFilepath = path + "/lastFile.txt"
    if os.path.isfile(lastFilepath) : 
        f = open(lastFilepath, "r")
        lastFileCounter = int(f.read()) + 1
        f.close()

    writeOnFile(lastFilepath,str(lastFileCounter))
    writeOnFile(path +"/" + str(lastFileCounter) +".json" ,str(data) )
