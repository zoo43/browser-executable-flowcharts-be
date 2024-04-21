import os
import glob

#type can be "modifications" or "executions"
def saveFile(data, type):
    exId = data['exId']
    exId = "4" #da togliere
    userId = data['userId']

    del data['userId']
    del data['exId']
    
    path = f'Files/Class/' + userId  
    if not os.path.exists(path):
        os.mkdir(path)

    path = f'Files/Class/' + userId  + "/" + exId
    if not os.path.exists(path):
        os.mkdir(path)

    path = f'Files/Class/' + userId  + "/" + exId+ "/"+ type
    if not os.path.exists(path):
        os.mkdir(path)
    
    lastFileCounter = 1
    lastFilepath = path + "/lastFile.txt"
    if os.path.isfile(lastFilepath) : 
        print("Ciao")
        f = open(lastFilepath, "r")
        lastFileCounter = int(f.read()) + 1
        f.close()
        f = open(lastFilepath, "w")
        f.write(str(lastFileCounter))
        f.close()
    else:
        f = open(lastFilepath,"w")
        f.write("1")
        f.close()

    
    f = open(path +"/" + str(lastFileCounter) +".json", "w")
    f.write(str(data))
    f.close()