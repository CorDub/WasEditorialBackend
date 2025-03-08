import json

with open("/home/cordub/code/CorDub/WasEditorialBackend/helpers/books.json", "r") as file:
    books = json.load(file)

duplicates = []
for x in books:
    for y in books:
        if (x["ISBN"] == "nan" or x["ISBN"] == "na"):
            continue

        if ((x['ISBN'] == y['ISBN']) and (x['Title'] != y['Title'])):
            duplicates.append(x)
            duplicates.append(y)

print(duplicates)
