import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
const router = express.Router();

export async function addBookstore(req, res) {
  try {
    const inputs = {
      "name": req.body.name,
      "dealPercentage": parseFloat(req.body.dealPercentage),
      "contactName": req.body.contactName,
      "phoneBookstore": req.body.contactPhone,
      "phonePrefixBookstore": req.body.contactPhonePrefix,
      "emailBookstore": req.body.contactEmail,
      "wasRed": req.body.wasRed
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    //Check if bookstore still exists as deleted first
    const existingBookstore = await prismaClient.bookstore.findUnique({where:{name: inputs.name}})
    if (existingBookstore && existingBookstore.isDeleted) {
      const updatedDeletedBookstore = await prismaClient.bookstore.update({
        where: {
          id: existingBookstore.id
        },
        data: {
          name: existingBookstore.name + '_deleted'
        }
      })
    }

    //Then create the new bookstore
    const new_bookstore =  await prismaClient.bookstore.create({
      data: {
        name: inputs.name,
        deal_percentage: inputs.dealPercentage,
        contact_name: inputs.contactName,
        contact_phone: inputs.phoneBookstore,
        contact_phone_prefix: inputs.phonePrefixBookstore,
        contact_email: inputs.emailBookstore,
        wasRed: inputs.wasRed
      },
    });

    res.status(201).json({name: new_bookstore.name});
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the category'});
  }
}
router.post('/bookstore', addBookstore);

export default router;