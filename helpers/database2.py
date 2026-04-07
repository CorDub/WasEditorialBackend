import pandas as pd
import json

# import as a database and drop useless columns
was_df = pd.read_csv("/home/cordub/CorDub/WasEditorialBackend/helpers/BaseDeDatos.csv")

# add all authors
authors = []
for index, row in was_df.iterrows():
    nombre = str(row["Nombre"]).strip()
    appellido = str(row["Apellido"]).strip()
    authors.append([nombre, appellido])

# split dual authors and remove duplicates
authors2 = []
for author in authors: 
    if " - " in author[0]:
        split_nombre = author[0].split(" - ")
        split_appellido = author[1].split(" - ")
        author1 = [split_nombre[0], split_appellido[0]]
        author2 = [split_nombre[1], split_appellido[1]]
        if author1 not in authors2:
            authors2.append(author1)
        if author2 not in authors2:
            authors2.append(author2)

    elif author not in authors2:
        authors2.append(author)

# add all books
books = []
for index, row in was_df.iterrows():
    title = str(row["Libro"]).strip()
    categoria = int(row["Categoría"]) if not pd.isna(row["Categoría"]) else 1

    authors = []
    nombre_raw = str(row["Nombre"]).strip()
    appellido_raw = str(row["Apellido"]).strip()
    if " - " in nombre_raw:
        split_nombre = nombre_raw.split(" - ")
        split_appellido = appellido_raw.split(" - ")
        author1 = {"first_name": split_nombre[0], "last_name": split_appellido[0]}
        author2 = {"first_name": split_nombre[1], "last_name": split_appellido[1]}
        authors.append(author1)
        authors.append(author2)
    else:
        authors.append({
            "first_name": str(row["Nombre"]).strip(),
            "last_name": str(row["Apellido"]).strip()
            })
    
    books.append({
        "title": title,
        "authors": authors,
        "category": categoria,
        "quantity": 1,
        "pasta": "Blanda",
    })

with open("secondAuthors.json", "w") as json_file:
    json.dump(authors2, json_file, indent=2)

with open("secondBooks.json", "w") as json_file:
    json.dump(books, json_file, indent=2)
