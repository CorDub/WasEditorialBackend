import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function addMultipleAuthors(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient
    const prismaClient = req.prisma || prisma;
    const csvfile = req.files.archivo[0];
    if (!csvfile || !csvfile.originalname.endsWith(".csv")) {
      return res.status(400).json({"error": "file is not a .csv"});
    }
    const fileContent = csvfile.buffer.toString('utf-8');
    const lines = fileContent.split("\n");

    const errors = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        const fields = lines[i].split(",");

        const inputs = {
          firstName: fields[0],
          lastName: fields[1],
          // country: fields[2],
          // categoryId: parseInt(fields[3]),
          email: fields[2],
          phone: fields[3],
          birthday: fields[4],
          clabe: fields[5],
          name_bank_account: fields[6],
          bank: fields[7],
          swift: fields[8],
          referido: fields[9]
        }
        validateInputs(inputs);

        for (let j = 0; j < fields.length; j++) {
          if (fields[j] === "") {
            fields[j] = null
          }
        }
        // if (!fields[0] || !fields[1]) {
        //   throw new Error("Missing first name or last name");
        // }

        const deletedAuthor = await prismaClient.user.findFirst({
          where: {
            first_name: fields[0],
            last_name: fields[1],
            isDeleted: true
          }
        })

        if (deletedAuthor) {
          await prismaClient.user.delete({
            where: {
              first_name_last_name: {
                first_name: fields[0],
                last_name: fields[1],
              }
            }
          });
        }

        // const password = createRandomPassword();
        // const hashedPassword = await bcrypt.hash(password, 10);
        const addedAuthor = await prismaClient.user.create({
          data: {
            first_name: fields[0],
            last_name: fields[1],
            // country: fields[2],
            // categoryId: parseInt(fields[3]),
            email: fields[2],
            phone: fields[3],
            birthday: fields[4],
            clabe: fields[5],
            name_bank_account: fields[6],
            bank: fields[7],
            swift: fields[8],
            // password: hashedPassword,
            referido: fields[9]
          }
        })

        if (addedAuthor) {
          // sendSetPasswordMail(addedAuthor.email, addedAuthor.first_name, password);
          sendWelcomeMail(addedAuthor.email, addedAuthor.first_name);
        }
      } catch (error) {
        console.error(error)
        switch (true) {
          case error.toString().includes("Missing first name or last name"):
            errors.push({"line": i + 1, "error": "Faltó el nombre o appellido."})
            break;
          case error.message.includes("Unique constraint failed on the fields: (`email`)"):
            errors.push({"line": i + 1, "error": "Este correo ya está tomado."})
            break;
          case error.message.includes("Unique constraint failed on the fields: (`clabe`)"):
            errors.push({"line": i + 1, "error": "Este clabe ya está tomada."})
            break;
          case error.message.includes("Unique constraint failed on the fields: (`first_name`,`last_name`)"):
            errors.push({"line": i + 1, "error": "Este autor ya existe."})
            break;
          default:
            errors.push({"line": i + 1, "error": error})
        }
      }
    }

    res.status(200).json({"message": "added multiple authors", "failed": errors});
  } catch(error) {
    res.status(500).json({"error": error});
  }
}
router.post('/api/author/addMultiples', upload.fields([{name: "archivo", maxCount: 1}]), addMultipleAuthors);

export default router;