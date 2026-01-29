import pandas as pd
import json
import re

#import as a database
was_df = pd.read_csv("/home/cordub/CorDub/WasEditorialBackend/helpers/WasAutores.csv")
was_df = was_df.drop(columns=["Pais"])
was_df = was_df.rename(columns={
    "Numero telefónico": "Phone",
    "Código Swift": "Swift_code",
    "Fecha de nacimiento": "Birthday",
    "Nombre del titular": "Name_bank_account"
})

swift_regex = re.compile(r"^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$")
def is_valid_swift(code: str) -> bool:
    return bool(swift_regex.fullmatch(code))

authors = []
full_names = []
clabes = []
manual_lines = []
correo_number = 0;

for row in was_df.itertuples(index=True):
  authorBeingBuilt = {}

  ### Nombre
  first_name_str = str(row.Nombre).strip()

  # deal with line 32 manually
  split = first_name_str.split(",")
  if len(split) > 1:
    manual_lines.append({row.Index : "multiple authors"})
    continue

  #multiple author format
  split_guion = first_name_str.split("-")
  if len(split_guion) > 1:
    manual_lines.append({row.Index : "multiple authors"})
    continue

  #any other cases
  authorBeingBuilt["first_name"] = first_name_str


  ### Apellido
  apellido_str = str(row.Apellido).strip()
  authorBeingBuilt["last_name"] = apellido_str
  full_name = authorBeingBuilt["first_name"] + " " + authorBeingBuilt["last_name"]
  if full_name in full_names: 
    # manual_lines.append({row.Index : f"duplicate, {full_name}"})
    continue
  full_names.append(full_name)
  authorBeingBuilt["full_name"] = full_name
  # print(full_names)

  ### Categoria
  authorBeingBuilt["categoryId"] = row.Categoria

  ### Correo
  if pd.isna(row.Correo):
    authorBeingBuilt["email"] = f"no_email_{correo_number}@no_email.com"
    correo_number +=1
  else:
    authorBeingBuilt["email"] = str(row.Correo.strip().lower())

  ### Teléfono
  phone_str = str(row.Phone)
  if not phone_str.startswith("+"):
    phone_str = "+52" + " " + phone_str

  phone_split = phone_str.split(" ")
  phone_prefix = phone_split[0]
  phone_number = ''.join(phone_split[1:])

  phone_number = phone_number.replace("-", "")
  phone_number = phone_number.replace("(", "")
  phone_number = phone_number.replace(")", "")
  phone_number = phone_number.replace("/", "")
  phone_number = phone_number.replace(" ", "")
  full_phone_number = phone_prefix + phone_number

  if len(full_phone_number) < 10 or len(full_phone_number) > 14:
    empty_phone = "0000000000"
    authorBeingBuilt["phone"] = empty_phone
    authorBeingBuilt["phonePrefix"] = phone_prefix
  else:
    authorBeingBuilt["phone"] = phone_number
    authorBeingBuilt["phonePrefix"] = phone_prefix
  

  ### Birthday
  if not pd.isna(row.Birthday):
    padded_birthday = ""
    birthday_str = str(row.Birthday)
    split_birthday = birthday_str.split("/")
    for split in split_birthday:
      if len(split) == 1:
        padded_birthday = padded_birthday + "0" + split
      else:
        padded_birthday = padded_birthday + split
    authorBeingBuilt["birthday"] = padded_birthday
  

  ### CLABE
  if not pd.isna(row.CLABE):
    clabe_str = str(row.CLABE)
    clabe_str = clabe_str.replace(" ", "")
    # if not clabe_str.isdigit():
    #   manual_lines.append({row.Index: "clabe missing"})
    if clabe_str.isdigit():
      if clabe_str in clabes:
        manual_lines.append({rowIndex: "clabe duplicate"})
        continue
      else: 
        authorBeingBuilt["clabe"] = clabe_str
        clabes.append(clabe_str)
  

  ### Nombre del titular
  if not pd.isna(row.Name_bank_account):
    authorBeingBuilt["name_bank_account"] = str(row.Name_bank_account).strip()
  
  ### Banco
  if not pd.isna(row.Banco):
    authorBeingBuilt["bank"] = str(row.Banco).strip()

  ### Swift code
  if not pd.isna(row.Swift_code):
    str_swift = str(row.Swift_code).strip()
    if is_valid_swift(str_swift):
      authorBeingBuilt["swift"] = str_swift

  
  authors.append(authorBeingBuilt)

print(manual_lines)

with open("finalAuthorList.json", "w") as json_file:
  json.dump(authors, json_file, indent=2)





  
