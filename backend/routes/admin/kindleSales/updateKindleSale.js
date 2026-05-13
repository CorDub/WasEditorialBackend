import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
  getForMonthStr,
  getForMonth
} from "../../../utils.js";
const router = express.Router();

export async function updateKindleSale(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
      quantityEbook: parseInt(req.body.quantityEbook),
      quantityPod: parseInt(req.body.quantityPod),
      dateCutStr: req.body.dateCutStr,
      datePayStr: req.body.datePayStr,
      regaliasKindle: parseFloat(req.body.regalias)
    }
    validateInputs(inputs)
    if (inputs.dateCut >= inputs.datePay) {
      throw new Error("dateCut later than datePay");
    }
    if ((inputs.quantityEbook + inputs.quantityPod) <= 0) {
      throw new Error("quantityEbook or quantityPod has to be positive");
    }

    const prismaClient = req.prisma || prisma

    const targetSale = await prismaClient.kindleSale.findUnique({
      where: {
        id: inputs.id
      },
      include: {
        book: {
          include: {
            users: true
          }
        },
        payments: true
      }
    })
    if (targetSale.isDeleted) { throw new Error ("deleted kindle sale") }

    let previousSalePayments = []
    for (const payment of targetSale.payments) {
      previousSalePayments.push({"id": payment.id})
    }

    let recipientPayments = []
    if (getForMonthStr(inputs.datePayStr) !== getForMonthStr(targetSale.datePayStr)) {
      for (const user of targetSale.book.users) {
        const existingPayment = await prismaClient.payment.findUnique({
          where: {
            userId_forMonth: {
              userId: user.id,
              forMonth: getForMonthStr(inputs.datePayStr)
            }
          }
        })

        if (!existingPayment) {
          const createdPayment = await prismaClient.payment.create({
            data: {
              userId: user.id,
              forMonth: getForMonthStr(inputs.datePayStr)
            }
          })

          recipientPayments.push({"id": createdPayment.id})
          continue;
        }

        if (existingPayment && existingPayment.isDeleted) {
          const deletedPayment = await prismaClient.payment.delete({where: {id: existingPayment.id}})
          const recreatedPayment = await prismaClient.payment.create({
            data: {
              userId: user.id,
              forMonth: getForMonthStr(inputs.datePayStr)
            }
          });
          recipientPayments.push({"id": recreatedPayment.id});
          continue;
        }

        if (existingPayment && !existingPayment.isDeleted && existingPayment.status === "created") {
          recipientPayments.push({"id": existingPayment.id});
          continue;
        }

        if (existingPayment
        && !existingPayment.isDeleted
        && (existingPayment.status === "paid" || existingPayment.status === "solicited")) {
          let currentForMonthDate = new Date(existingPayment.forMonth + "-01")
          let nextPaymentDate = new Date(currentForMonthDate)
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() +1)

          let nextPayment = await prismaClient.payment.findUnique({where: {
            userId_forMonth: {
              userId: user.id,
              forMonth: getForMonth(nextPaymentDate)
            }
          }})

          let paymentEncountered = false;
          while(nextPayment) {
            if (nextPayment.isDeleted
            || nextPayment.status === "solicited"
            || nextPayment.status === "paid") {
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() +1)
              nextPayment = await prismaClient.payment.findUnique({where: {
                userId_forMonth: {
                  userId: user.id,
                  forMonth: getForMonth(nextPaymentDate)
                }
              }})
              continue;

            } else {
              paymentEncountered = true;
              recipientPayments.push({"id": nextPayment.id})
              break;
            }
          }

          if (!paymentEncountered) {
            const newPayment = await prismaClient.payment.create({
              data: {
                userId: user.id,
                forMonth: getForMonth(nextPaymentDate)
              }
            })

            recipientPayments.push({"id": newPayment.id});
            continue;
          }
        }
      };
    }

    const updatedKindleSale = await prismaClient.kindleSale.update({
      where: {
        id: inputs.id
      },
      data: {
        quantityEbook: inputs.quantityEbook,
        quantityPod: inputs.quantityPod,
        dateCutStr: inputs.dateCutStr,
        datePayStr: inputs.datePayStr,
        regalias: inputs.regaliasKindle,
        payments: {
          set: recipientPayments.length > 0 ? recipientPayments : previousSalePayments
        }
      }
    })

    res.status(200).json({message: "updated kindle sale successfully"})
  } catch(error) {
    console.error("Server error at updating kindlesales ", error);
    res.status(500).json({error: "Server error while updating the kindle sale"})
  }
}
router.patch("/kindlesales/:id", updateKindleSale)

export default router;