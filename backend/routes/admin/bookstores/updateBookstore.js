import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
const router = express.Router();

export async function updateBookstore(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
      "name": req.body.name,
      "dealPercentage": parseFloat(req.body.dealPercentage),
      "contactName": req.body.contactName,
      "phoneBookstore" : req.body.contactPhone,
      "phonePrefixBookstore": req.body.contactPhonePrefix,
      "emailBookstore": req.body.contactEmail,
      "wasRed": req.body.wasRed
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const existingBookstore = await prismaClient.bookstore.findUnique({where: {id: inputs.id}});
    if (existingBookstore.isDeleted) {throw new Error("this bookstore is deleted")};
    if (!existingBookstore) {throw new Error("wrong id - could not find the bookstore")};

    await prismaClient.$transaction(async (tx) => {
      const updatedBookstore = await tx.bookstore.update({
        where: {id: inputs.id},
        data: {
          name: inputs.name,
          deal_percentage: inputs.dealPercentage,
          contact_name: inputs.contactName,
          contact_phone: inputs.phoneBookstore,
          contact_phone_prefix: inputs.phonePrefixBookstore,
          contact_email: inputs.emailBookstore,
          wasRed: inputs.wasRed
        }
      });

      res.status(200).json({message: "Successfully updated bookstore"});
    })
  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
    res.status(500).json({error: "There was an issue updating the bookstore"});
  }
}
router.patch('/bookstore/:id', updateBookstore);

export default router;