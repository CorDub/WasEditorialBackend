import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
  getForMonth,
  getForMonthStr,
} from "../../../utils.js";
const router = express.Router();

export async function addCost(req, res) {
  try {
    const inputs = {
      "paymentId": req.body.paymentId ? parseInt(req.body.paymentId) : null,
      "amount": parseFloat(req.body.amount),
      "note": req.body.note,
      "dateStrOptional": req.body.dateStr ? req.body.dateStr : null,
      "bookId": parseInt(req.body.bookId),
    }
    validateInputs(inputs);

    const costForMonth = inputs.dateStrOptional
      ? getForMonthStr(inputs.dateStrOptional)
      : getForMonth(new Date())

    const [yr, mo] = costForMonth.split('-').map(Number)
    const costNextForMonth = mo === 12
      ? `${yr + 1}-01`
      : `${yr}-${String(mo + 1).padStart(2, '0')}`

    const prismaClient = req.prisma || prisma;

    await prismaClient.$transaction(async (tx) => {
    // Make sure we got payment Id or Ids
      let paymentId;
      if (!inputs.paymentId) {
        const selectedBook = await tx.book.findFirst({
          where: {
            id: inputs.bookId,
            isDeleted: false
          },
          select: {
            mainAuthor: true
          }
        })

        // for (const user of selectedBook.users) {
        let userPayment = await tx.payment.findUnique({
          where: {
            userId_forMonth: {
              userId: selectedBook.mainAuthor,
              forMonth: costForMonth
            },
          }
        })

        if (!userPayment) {
          const newPayment = await tx.payment.create({
            data: {
              userId: selectedBook.mainAuthor,
              forMonth: costForMonth
            }
          })
          paymentId = newPayment.id;
        }

        if (userPayment && userPayment.status !== 'created') {
          const newPaymentNextMonth = await tx.payment.create({
            data: {
              userId: selectedBook.mainAuthor,
              forMonth: costNextForMonth
            }
          })
          paymentId = newPaymentNextMonth.id;
        }

        if (userPayment && userPayment.isDeleted) {
          const deletedPayment = await tx.payment.delete({
            where: {
              id: userPayment.id
            }
          })

          const resetPayment = await tx.payment.create({
            data: {
              userId: selectedBook.mainAuthor,
              forMonth: costForMonth
            }
          })
          paymentId = resetPayment.id;
        }

        if (userPayment && !userPayment.isDeleted && userPayment.status === "created") {
          paymentId = userPayment.id;
        }
      } else {
        paymentId = inputs.paymentId;
      }

      // get a new cost for each paymentId
      const createdCost = await tx.cost.create({
        data: {
          paymentId: paymentId,
          amount: inputs.amount,
          dateStr: inputs.dateStrOptional,
          bookId: inputs.bookId,
          note: inputs.note
        }
      });

      res.status(201).json({message: "Cost created successfully"});
    })

  } catch (error) {
    console.error("\n ERROR CREATING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while creating the cost"})
  }
}
router.post('/cost', addCost)

export default router;