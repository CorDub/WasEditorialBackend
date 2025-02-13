import pandas as pd
import json

# import as a database and drop useless columns
was_df = pd.read_csv("/home/cordub/code/CorDub/WasEditorialBackend/helpers/was_database.csv")
was_df = was_df.drop(columns=['Unnamed: 0', 'Publisher', 'Unnamed: 5'])


# remove empty lines and deduplicate authors
authors = []
for x in was_df['Author(s)']:
    x_string = str(x)
    split = x_string.split(',')
    for y in split:
        y_split = y.split(' ')

        for z in y_split:
            if z == "":
                y_split.remove(z)
            z = z.capitalize()
        y_capitalized = " ".join(y_split)
        print(y_capitalized)
        if y_capitalized in authors or y == "nan":
            continue
        authors.append(y_capitalized)

# remove dual authors (José Maria Gonzalez y Maria Esteban)
authors2 = []
for author in authors:
    split = author.split(" y ")
    for x in split:
        if x in authors2:
            continue
        authors2.append(x)

# capitalize all first names and last names
authors_capped = []
for author in authors2:
    split = author.split(' ')
    capped=[]
    for x in split:
        capped.append(x.capitalize())
    capped_author = " ".join(capped)
    if capped_author in authors_capped:
        continue
    authors_capped.append(capped_author)

# split names into first names and last names
authors_final = []
for author in authors_capped:
    split = author.split(' ')
    author_split = {
        "first_name": "",
        "last_name": ""
    }
    if len(split) == 1:
        author_split["first_name"] = split[0]
        authors_final.append(author_split)
    if len(split) == 2:
        author_split['first_name'] = split[0]
        author_split['last_name'] = split[1]
        authors_final.append(author_split)
    if len(split) == 3:
        author_split['first_name'] = " ".join([split[0], split[1]])
        author_split['last_name'] = split[2]
        authors_final.append(author_split)
    if len(split) > 3:
        author_split['first_name'] = " ".join([split[0], split[1]])
        author_split['last_name'] = " ".join(x for x in split[2:])
        authors_final.append(author_split)

with open("authors.json", "w") as json_file:
    json.dump(authors_final, json_file, indent=2)
