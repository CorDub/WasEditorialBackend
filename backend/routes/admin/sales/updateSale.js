export async function updateSale(req, res) {
  try {
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
      const selectedInventory = await tx.inventory.findUnique({where : {
        bookId_bookstoreId: {
          bookId : inputs.bookId,
          bookstoreId: inputs.bookstoreId,
        }}});

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
                  users: true
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

      let previousSalePayments = []
      for (const payment of previousSale.payments) {
        previousSalePayments.push({"id": payment.id})
      }

      let quantityUpdate = previousSale.quantity - inputs.quantity;

      if ((selectedInventory.current + quantityUpdate) < 0) {
        res.status(400).json({ message: "El inventario tiene menos libros que la cantidad entrada."});
        return;
      }

      let recipientPayments = []
      if (getForMonthStr(inputs.dateStr) !== getForMonthStr(previousSale.dateStr)) {
        for (const user of previousSale.inventory.book.users) {
          const existingPayment = await prismaClient.payment.findUnique({
            where: {
              userId_forMonth: {
                userId: user.id,
                forMonth: getForMonthStr(inputs.dateStr)
              }
            }
          })

          if (!existingPayment) {
            const createdPayment = await prismaClient.payment.create({
              data: {
                userId: user.id,
                forMonth: getForMonthStr(inputs.dateStr)
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
                forMonth: getForMonthStr(inputs.dateStr)
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
        const updatedInventory = await tx.inventory.update({
          where: {id: selectedInventory.id},
          data: {
            current: (selectedInventory.current + previousSale.quantity) - inputs.quantity
          }
        });

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