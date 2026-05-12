import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
  getForMonth,
} from "../../../utils.js";
const router = express.Router();

export async function addKindleSale (req, res) {
  try {
    const inputs = {
      "bookId": parseInt(req.body.book),
      "quantityEbook": parseInt(req.body.quantityEbook),
      "quantityPod": parseInt(req.body.quantityPod),
      "dateCutStr": req.body.dateCutStr,
      "datePayStr": req.body.datePayStr,
      "regaliasKindle": parseFloat(req.body.regalias),
    }
    validateInputs(inputs);
    if (inputs.dateCutStr >= inputs.datePayStr) {
      throw new Error("dateCut later than datePay");
    }
    if ((inputs.quantityEbook + inputs.quantityPod) <= 0) {
      throw new Error("quantityEbook or quantityPod has to be positive");
    }

    const prismaClient = req.prisma || prisma

    const createdKindleSaleTransaction = await prismaClient.$transaction(async (tx) => {
      const bookSold = await tx.book.findUnique({
        where: {
          id: inputs.bookId
        },
        include: {
          users: true
        }
      })

      let authorIds = [];
      for (const user of bookSold.users) {
        authorIds.push(user.id)
      }

      let paymentIds = [];
      for (const author of authorIds) {
        const payment = await tx.payment.findUnique({
          where: {
            userId_forMonth: {
              userId: author,
              forMonth: getForMonth(inputs.datePayStr)
            }
          }
        })

        if (payment) {
          paymentIds.push({"id": payment.id})
        } else {
          const createdPayment = await tx.payment.create({
            data: {
              userId: author,
              forMonth: getForMonth(inputs.datePayStr)
            }
          })
          paymentIds.push({"id": createdPayment.id})
        }
      }

      const createdKindleSale = await tx.kindleSale.create({
        data: {
          bookId: inputs.bookId,
          payments: {
            connect: paymentIds
          },
          quantityEbook: inputs.quantityEbook,
          quantityPod: inputs.quantityPod,
          dateCutStr: inputs.dateCutStr,
          datePayStr: inputs.datePayStr,
          regalias: inputs.regaliasKindle
        }
      });

      return createdKindleSale
    });

    res.status(200).json({message: "kindleSale created successfully"})
  } catch(error) {
    console.error("Server error at kindlesales ", error);
    res.status(500).json({error: "Server error while updating the kindle sale"})
  }
}
router.post("/kindlesales", addKindleSale);

export default router;