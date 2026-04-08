import pandas as pd
import json
import re

# import as a database and drop useless columns
was_df = pd.read_csv("/home/cordub/CorDub/WasEditorialBackend/helpers/database3.csv")

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
    
    ## Phone and PhonePrefix
    phonePrefix = None
    phone = None
    phoneRaw = str(row["Número telefónico"]).strip() 
    phoneRawSplit = phoneRaw.split(" ")

    if phoneRaw == "nan" or phoneRaw == None:
        phonePrefix == "+52"
        phone == None
    elif phoneRaw[0] == "+":
        phonePrefix = phoneRawSplit[0]
        phone = "".join(phoneRawSplit[1:])
        phone = phone.replace("-", "")
        phone = phone.replace("(", "")
        phone = phone.replace(")", "")
        phone = phone.replace("/", "")
        phone = phone.replace(" ", "")
    else :
        phonePrefix = "+52"
        phone = "".join(phoneRawSplit)

    ## Birthday
    birthday = None
    if not pd.isna(row["Fecha de nacimiento"]):
        birthdayRaw = str(row["Fecha de nacimiento"]).strip()
        birthdaySplit = birthdayRaw.split("/")
        paddedBirthday = ""
        for split in birthdaySplit:
            if len(split) == 1:
                paddedBirthday = paddedBirthday + "0" + split
            else:
                paddedBirthday = paddedBirthday + split
        day = paddedBirthday[0:2]
        month = paddedBirthday[2:4]
        year = paddedBirthday[4:]
        if int(day) < 1 or int(day) > 31:
            birthday = None
        if int(month) < 1 or int(month) > 12:
            birthday == None
        if int(year) > 2026 or int(year) < 1900:
            birthday == None
    
    ##Clabe
    clabe = None
    if not pd.isna(row["CLABE"]):
        clabe_str = str(row["CLABE"]).strip()
        clabe_str = clabe_str.replace(" ", "")
        if clabe_str.isdigit():
            clabe = clabe_str

    ## Name bank account
    nombreDelTitular = None
    if not pd.isna(row["Nombre del titular"]):
        nombreDelTitular = str(row["Nombre del titular"]).strip()
    
    ## Bank
    banco = None
    if not pd.isna(row["Banco"]):
        banco = str(row["Banco"]).strip()

    ## Swift code
    swiftCode = None
    if not pd.isna(row["Código Swift"]):
        str_swift = str(row["Código Swift"]).strip()
        if is_valid_swift(str_swift):
            swiftCode = str_swift

    ## assignment
    authors[0].update({
        "email": correo,
        "phonePrefix": phonePrefix,
        "phone": phone,
        "birthday": birthday,
        "clabe": clabe,
        "name_bank_account": nombreDelTitular,
        "bank": banco,
        "swift": swiftCode
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
        "pasta": "Blanda",
        "isbn": isbn
    })

with open("thirdBooks.json", "w") as json_file:
    json.dump(books, json_file, indent=2)
