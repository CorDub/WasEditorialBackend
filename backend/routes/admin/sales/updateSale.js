import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
  getForMonthStr,
  getForMonth 
} from "../../../utils.js" 
import { getInventoryDerived } from "../inventories/inventoryHelpers.js";

const router = express.Router();

export async function updateSale(req, res) {
  try {
    console.log("correct route called")
    //1. validate inputs
    const inputs = {
      id: parseInt(req.params.id),
      bookId: parseInt(req.body.book),
      bookstoreId: parseInt(req.body.bookstore),
      quantity: parseInt(req.body.quantity),
      dateStr: req.body.dateStr
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      //2. get the affected inventory and previous sale
      const selectedInventory = await tx.inventory.findUnique({
        where : {
          bookId_bookstoreId: {
            bookId : inputs.bookId,
            bookstoreId: inputs.bookstoreId,
          }
        },
        include: {
          book: {
            include: {
              impressions: true
            }
          },
          bookstore: true,
          sales: true,
          transfersFrom: true,
          transfersTo: true
        }
      });

      if (!selectedInventory || selectedInventory.isDeleted) {
        res.status(400).json({ message: "No existe un inventario con esta combinación de titulo y librería"});
        return;
      }

      const previousSale = await tx.sale.findUnique({
        where: {
          id: inputs.id
        },
        include: {
          inventory: {
            include: {
              book: {
                include: {
                  users: true,
                  impressions: true
                }
              },
              bookstore: true
            }
          },
          payments: true
        }
      });

      if (previousSale.isDeleted) {
        res.status(400).json({message: "Esta venta ha sido eliminada"})
        return;
      }

      //3. get payments attached to sale
      let previousSalePayments = []
      for (const payment of previousSale.payments) {
        previousSalePayments.push({"id": payment.id})
      }

      //4. Check that you're not entering a sale that is more than remaining books in the inventory.
      let quantityUpdate = previousSale.quantity - inputs.quantity;

      const derived = getInventoryDerived(selectedInventory) 
      if ((derived.disponibles + quantityUpdate) < 0) {
        return res.status(400).json({message: `No hay sufficientes libros en el inventario. Libros disponibles: ${derived.disponibles}`})
      }

      //5. Check that the sale is attached to the correct payments if the date has been updated
      let recipientPayments = []
      if (getForMonthStr(inputs.dateStr) !== getForMonthStr(previousSale.dateStr)) {
        for (const user of previousSale.inventory.book.users) {
          const validPayment = await getValidPayment(user, inputs.dateStr, tx)
          recipientPayments.push({"id": validPayment})
        };
      }

      //6. Fnally update the sale
      const updatedSale = await tx.sale.update({
        where: {id: inputs.id},
        data: {
          inventoryId: selectedInventory.id,
          quantity: inputs.quantity,
          dateStr: inputs.dateStr,
          payments: {
            set: recipientPayments.length > 0 ? recipientPayments : previousSalePayments
          }
        },
        include: {
          inventory: {
            include: {
              book: {
                include: {
                  users: true
                }
              },
              bookstore: true
            }
          },
          payments: true
        }
      });

      if (updatedSale) {
        res.status(200).json({message: "Successfully updated sale"});
      } else {
        if (String(error).includes(("Unique constraint failed on the fields: (`bookId`,`bookstoreId`)"))) {
          res.status(500).json({message: "Este inventario ya existe"})
          return;
        }
        res.status(500).json({error: "There was an issue updating the sale"});
      };
    })

  } catch(error) {
    console.error("Server error at the update sale route:", error);
    res.status(500).json({error: "There was an issue updating the sale"});
  }
}
router.patch('/sale/:id', updateSale);



export async function getValidPayment(user, dateStr, prismaClient) {
  //1. check if there is an existing pa&yment for this user for the new date
  const existingPayment = await prismaClient.payment.findUnique({
    where: {
      userId_forMonth: {
        userId: user.id,
        forMonth: getForMonthStr(dateStr)
      }
    }
  })

  //2. if the payment doesn't exist create it
  if (!existingPayment) {
    const createdPayment = await prismaClient.payment.create({
      data: {
        userId: user.id,
        forMonth: getForMonthStr(dateStr)
      }
    })
    // recipientPayments.push({"id": createdPayment.id})
    return createdPayment.id
  }

  //3. if it exist but is flagged as deleted, delete it and recreate it
  if (existingPayment && existingPayment.isDeleted) {
    const deletedPayment = await prismaClient.payment.delete({where: {id: existingPayment.id}})
    const recreatedPayment = await prismaClient.payment.create({
      data: {
        userId: user.id,
        forMonth: getForMonthStr(dateStr)
      }
    });
    // recipientPayments.push({"id": recreatedPayment.id});
    return recreatedPayment.id
  }

  //4. if it exists and its status is "created", return the id
  if (existingPayment && !existingPayment.isDeleted && existingPayment.status === "created") {
    // recipientPayments.push({"id": existingPayment.id});
    return existingPayment.id
  }

  //5. if it exists but its status is either "paid" or "solicited"
  if (existingPayment
    && !existingPayment.isDeleted
    && (existingPayment.status === "paid" || existingPayment.status === "solicited")) {
    
    //5.1 find the next one chronologically that exist and is not paid or solicited
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
        // recipientPayments.push({"id": nextPayment.id})
        return nextPayment.id
        // break;
      }
    }

    //5.2 if there's no existing valid nextPayment, create one
    if (!paymentEncountered) {
      const newPayment = await prismaClient.payment.create({
        data: {
          userId: user.id,
          forMonth: getForMonth(nextPaymentDate)
        }
      })

      // recipientPayments.push({"id": newPayment.id});
      return newPayment.id
    }
  }
}

export default router;