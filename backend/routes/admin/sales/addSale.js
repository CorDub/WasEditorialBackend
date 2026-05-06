import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
  getForMonthStr 
} from "../../../utils.js" 
import {
  getInventoryDerived
} from "../inventories/inventoryHelpers.js"
const router = express.Router();

export async function addSale(req, res) {
  try {
    const inputs = {
      "bookId": parseInt(req.body.bookId),
      "bookstoreId": parseInt(req.body.bookstoreId),
      "quantity": parseInt(req.body.quantity),
      "dateStr": req.body.dateStr
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    let createdSale;
    await prismaClient.$transaction(async (tx) => {
      const selectedInventory = await tx.inventory.findUnique({
        where : {
          bookId_bookstoreId: {
            bookId : inputs.bookId,
            bookstoreId: inputs.bookstoreId,
          }
        },
        include: {
          bookstore: true,
          book: {
            include: {
              impressions: true
            }
          },
          sales: true,
          transfersFrom: true,
          transfersTo: true
        }
      });

      if (!selectedInventory) {
        res.status(400).json({ message: "No existe un inventario con esta combinación de titulo y librería"});
        return;
      }

      // if (selectedInventory.current < inputs.quantity) {
      //   res.status(400).json(
      //     { message: "El inventario tiene menos libros disponibles que la cantidad entrada."}
      //   );
      //   return;
      // }

      const derived = getInventoryDerived(selectedInventory) 
      if (derived.disponibles < inputs.quantity) {
        res.status(400).json(
          { message: "El inventario tiene menos libros disponibles que la cantidad entrada."}
        );
        return;
      }

      const bookWithUsers = await tx.book.findUnique({
        where: {
          id: inputs.bookId
        },
        include: {
          users: true
        }
      })

      const authorListIds = bookWithUsers.users.map(user => user.id);
      // const saleForMonth = getForMonth(dateMexico);
      const saleForMonth = getForMonthStr(inputs.dateStr);
      let paymentIds = []
      for (const authorId of authorListIds) {
        const existingPayment = await tx.payment.findUnique({
          where: {
            userId_forMonth: {
              userId: authorId,
              forMonth: saleForMonth
            }
          }
        });

        if (existingPayment && !existingPayment.isDeleted) {
          paymentIds.push({"id": existingPayment.id})
        }

        if (existingPayment && existingPayment.isDeleted) {
          const deletedPayment = await tx.payment.delete({ where: {id: existingPayment.id}})
          const recreatedPayment = await tx.payment.create({
            data: {
              userId: authorId,
              forMonth: saleForMonth
            }
          })
          paymentIds.push({"id": recreatedPayment.id})
        };

        if (!existingPayment) {
          const createdPayment = await tx.payment.create({
            data: {
              userId: authorId,
              forMonth: saleForMonth,
            }
          });
          paymentIds.push({"id": createdPayment.id})
        }
      }

      if (paymentIds.length === 0) {
        throw new Error ("This sale has no payments")
      }

      createdSale = await tx.sale.create({
        data: {
          inventoryId: selectedInventory.id,
          quantity: inputs.quantity,
          dateStr: inputs.dateStr,
          payments: {
            connect: paymentIds
          }
        },
        include: {
          payments: true
        }
      })

      // if (createdSale) {
      //   const updatedInventory = await tx.inventory.update({
      //     where: {id: selectedInventory.id},
      //     data: {
      //       current: selectedInventory.current - inputs.quantity
      //     }
      //   });
      // }
    })

    res.status(201).json(createdSale);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
}
router.post('/sale', addSale)

export default router;