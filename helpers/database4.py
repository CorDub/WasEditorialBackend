import pandas as pd
import json
import re

# import as a database and drop useless columns
was_df = pd.read_csv("/home/cordub/CorDub/WasEditorialBackend/helpers/database4.csv")

swift_regex = re.compile(r"^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$")
def is_valid_swift(code: str) -> bool:
    return bool(swift_regex.fullmatch(code))

# add all books
books = []
for index, row in was_df.iterrows():
    title = str(row["Libro"]).strip()
    categoria = int(row["Categoría"]) if not pd.isna(row["Categoría"]) else 1

    authors = []

    ## Nombres
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
    
    ## Correo
    correo = str(row["Correo"]).strip() if not pd.isna(row["Correo"]) else None
    if correo == "0":
        correo = None
    
    ## Phone and PhonePrefix
    print(was_df["País"].unique())
    phonePrefix = None
    phone = None
    phoneRaw = str(row["Telefono"]).strip()
    if str(row["País"]).strip() == "Estados Unidos":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "México":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+52"):
            phonePrefix = phoneRaw[:3]
            phone = phoneRaw[3:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "Colombia":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+57"):
            phonePrefix = phoneRaw[:3]
            phone = phoneRaw[3:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "Costa Rica":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+506"):
            phonePrefix = phoneRaw[:4]
            phone = phoneRaw[4:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "Perú":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+51"):
            phonePrefix = phoneRaw[:3]
            phone = phoneRaw[3:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "Venezuela":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+58"):
            phonePrefix = phoneRaw[:3]
            phone = phoneRaw[3:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "España":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+34"):
            phonePrefix = phoneRaw[:3]
            phone = phoneRaw[3:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "Puerto Rico":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+34"):
            phonePrefix = phoneRaw[:3]
            phone = phoneRaw[3:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "Argentina":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+54"):
            phonePrefix = phoneRaw[:3]
            phone = phoneRaw[3:]
        else:
            phonePrefix = None
            phone = None
    elif str(row["País"]).strip() == "Paraguay":
        if phoneRaw.startswith("+1"):
            phonePrefix = phoneRaw[:2]
            phone = phoneRaw[2:]
        elif phoneRaw.startswith("+595"):
            phonePrefix = phoneRaw[:4]
            phone = phoneRaw[4:]
        else:
            phonePrefix = None
            phone = None

    ## Birthday
    birthday = None
    if not pd.isna(row["Fecha de nacimiento"]):
        birthdayRaw = str(int(row["Fecha de nacimiento"])).strip()
        birthday = birthdayRaw
    
    ##Clabe
    clabe = None
    if not pd.isna(row["Clave"]):
        clabe_str = str(row["Clave"]).strip()
        clabe_str = clabe_str.replace(" ", "")
        if clabe_str.isdigit():
            clabe = clabe_str
    if clabe == "0":
        clabe = None

    ## Name bank account
    nombreDelTitular = None
    if not pd.isna(row["Titular"]):
        nombreDelTitular = str(row["Titular"]).strip()
    if nombreDelTitular == "0":
        nombreDelTitular = None

    ## Swift code
    swiftCode = None
    if not pd.isna(row["SWIFT"]):
        str_swift = str(row["SWIFT"]).strip()
        if is_valid_swift(str_swift):
            swiftCode = str_swift
    if swiftCode == "0":
        swiftCode = None

    ##Pasta
    pasta = None
    if not pd.isna(row["Pasta"]):
        str_pasta = str(row["Pasta"]).strip()
        if str_pasta == "Blanda" or str_pasta == "Dura":
            pasta = str_pasta

    ## assignment
    authors[0].update({
        "email": correo,
        "phonePrefix": phonePrefix,
        "phone": phone,
        "birthday": birthday,
        "clabe": clabe,
        "name_bank_account": nombreDelTitular,
        # "bank": banco,
        "swift": swiftCode,
        "pasta": pasta
    })

    ##ISBN
    isbn = None
    isbnRaw = str(row["ISBN"]).strip() if not pd.isna(str(row["ISBN"])) else None
    if isbnRaw != None:
        isbn_str = isbnRaw.replace("-", "")
        if isbn_str.isdigit():
            isbn = isbn_str
    
    books.append({
        "title": title,
        "authors": authors,
        "category": categoria,
        "quantity": 1,
        "isbn": isbn
    })

with open("fourthBooks.json", "w") as json_file:
    json.dump(books, json_file, indent=2)
