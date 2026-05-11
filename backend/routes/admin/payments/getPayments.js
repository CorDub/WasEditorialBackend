import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
  calculateAuthorRevenue 
} from "../../../utils";
const router = express.Router();

export async function getPayments(req, res) {
  try {
    const inputs = {
      status: req.query.status
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const selectedPayments = await prismaClient.payment.findMany({
      where: {
        isDeleted: false,
        status: inputs.status
      },
      select: {
        id: true,
        userId: true,
        dateMarkedAsPaid: true,
        status: true,
        isDeleted: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            id: true
          }
        },
        forMonth: true,
        sales: {
          select: {
            id: true,
            quantity: true,
            isDeleted: true,
            inventory: {
              select: {
                id: true,
                price: true,
                book: {
                  select: {
                    id: true,
                    category: {
                      select: {
                        id: true,
                        category_type: true,
                        percentage_royalties: true,
                        rebate_author: true,
                        percentage_management_stores: true,
                        management_min: true,
                      }
                    }
                  }
                },
                bookstore: {
                  select: {
                    id: true,
                    deal_percentage: true
                  }
                }
              }
            }
          }
        },
        kindleSales: {
          select: {
            id: true,
            regalias: true,
            isDeleted: true
          }
        },
        costs: {
          select: {
            id: true,
            amount: true,
            isDeleted: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    async function updateAmount(payment) {
      payment.amount = 0;

      async function updateSales(payment) {
        if (payment.sales.length > 0) {
          for (const sale of payment.sales) {

            if (sale.isDeleted === false) {
              const res = calculateAuthorRevenue(
                sale.inventory.book.category.category_type,
                sale.inventory.price,
                sale.inventory.bookstore.deal_percentage,
                sale.inventory.bookstore.id,
                sale.inventory.book.category.percentage_royalties,
                sale.inventory.book.category.rebate_author,
                sale.inventory.book.category.percentage_management_stores,
                sale.inventory.book.category.management_min,
                sale.quantity
              )
              payment.amount += res
            }
          }
        };
      }

      async function updateKindleSales(payment) {
        if (payment.kindleSales.length > 0) {
          for (const kindleSale of payment.kindleSales) {
            if (kindleSale.isDeleted === false) {
              payment.amount += kindleSale.regalias
            }
          }
        }
      }

      async function updateCosts(payment) {
        if (payment.costs.length > 0) {
          for (const cost of payment.costs) {
            if (cost.isDeleted === false) {
              payment.amount -= cost.amount
            }
          }
        }
      }

      await Promise.all([
        updateSales(payment),
        updateKindleSales(payment),
        updateCosts(payment)
      ])
    }

    const paymentsSent = [];
    const promises = selectedPayments.map(payment => updateAmount(payment));
    for (const payment of selectedPayments) {
      if (payment.amount > 0) {
        paymentsSent.push(payment)
      }
    }
    const results = await Promise.all(promises)

    // get a total
    let totalAmount = 0;
    for (const payment of selectedPayments) {
      totalAmount += payment.amount
    }

    const finalPayload = {
      totalAmount: totalAmount,
      selectedPayments: paymentsSent,
    }

    res.status(200).json(finalPayload);

  } catch (error) {
    console.error("\n ERROR FETCHING PAYMENTS \n", error);
    res.status(500).json({error: "a server error occurred while fetching payments"})
  }
}
router.get('/payments', getPayments);

export default router;