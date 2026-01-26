import pandas as pd
import json


was_df = pd.read_csv("/home/cordub/CorDub/WasEditorialBackend/helpers/WasLibros.csv")
was_df = was_df.rename(columns={
  'Nombre del autor': "FirstName",
  "Apellido del autor" : "LastName",
  "Título": "Titulo"
})

books = []
manual_lines = []

for row in was_df.itertuples(index=True):
  bookBeingBuilt = {}

  #Titulo
  title_str = str(row.Titulo).strip()
  bookBeingBuilt["title"] = title_str

  #ISBN
  isbn_str = str(row.ISBN).strip()
  isbn_str = isbn_str.replace("-", "")
  if isbn_str.isdigit():
    bookBeingBuilt["isbn"] = isbn_str

  #Main Author
  first_name_str = str(row.FirstName).strip()
  split = first_name_str.split(",")
  if len(split) > 1:
    manual_lines.append({row.Index : f"multiple authors - {row.Titulo}"})
    continue
  split_guion = first_name_str.split("-")
  if len(split_guion) > 1:
    manual_lines.append({row.Index : f"multiple authors - {row.Titulo}"})
    continue

  last_name_str = str(row.LastName).strip()
  full_name = first_name_str + " " + last_name_str
  bookBeingBuilt["first_name"] = first_name_str
  bookBeingBuilt["last_name"] = last_name_str
  bookBeingBuilt["author_name"] = full_name

  #Pasta
  bookBeingBuilt["pasta"] = str(row.Pasta).strip()

  #Quantity
  bookBeingBuilt["quantity"] = 1

  books.append(bookBeingBuilt)

with open("finalBooksList.json", "w") as json_file:
  json.dump(books, json_file, indent=2)
