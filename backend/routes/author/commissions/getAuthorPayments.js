import express from "express";
import { prisma } from "../../../prisma/client.js";
import {
  calculateAuthorRevenue,
  generateMonthKeysForRange,
} from "../../../utils.js"
import { resolveAuthorId } from "../resolveAuthorId.js";
import { applyCarryOver } from "../../admin/payments/carryOverBalance.js";
const router = express.Router();

export async function getAuthorPayments (req, res) {
  try {
    if (!req.session.user_id) {
      return res.status(401).json({message: "Unauthorized"})
    }

    const authorId = await resolveAuthorId(req);

    const prismaClient = req.prisma || prisma

    // Getting our range ready by setting it 12m ago
    const ltm = new Date();
    ltm.setMonth(ltm.getMonth()-12);
    ltm.setDate(1);

    // Getting all payments from that date to now
    const allPayments = await prismaClient.payment.findMany({
      where: {
        isDeleted: false,
        userId: authorId,
        createdAt: {
          gt: ltm
        }
      },
      select: {
        id: true,
        forMonth: true,
        isDeleted: true,
        status: true,
        sales: {
          select: {
            id: true,
            isDeleted: true,
            quantity: true,
            inventory: {
              select: {
                bookstore: {
                  select: {
                    deal_percentage: true
                  }
                },
                bookstoreId: true,
                price: true,
                book: {
                  select: {
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
                bookId: true
              }
            }
          }
        },
        kindleSales: {
          select: {
            id: true,
            isDeleted: true,
            quantityEbook: true,
            quantityPod: true,
            regalias: true
          }
        },
        costs: {
          select: {
            id: true,
            isDeleted: true,
            amount: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    let filteredAuthorPayments = new Map();
    for (const payment of allPayments) {
      const forMonthDate = new Date(payment.forMonth + "-01")
      if (forMonthDate >= ltm && !payment.isDeleted) {
        payment.amount  = 0

        if (payment.sales.length > 0) {
          for (const sale of payment.sales) {
            if (sale.isDeleted) {continue}

            payment.amount += calculateAuthorRevenue(
              sale.inventory.book.category.category_type,
              sale.inventory.price,
              sale.inventory.bookstore.deal_percentage,
              sale.inventory.bookstoreId,
              sale.inventory.book.category.percentage_royalties,
              sale.inventory.book.category.rebate_author,
              sale.inventory.book.category.percentage_management_stores,
              sale.inventory.book.category.management_min,
              sale.quantity
            )
          }
        }

        if (payment.kindleSales.length > 0) {
          for (const sale of payment.kindleSales) {
            if (sale.isDeleted) {continue}

            payment.amount += sale.regalias
          }
        }

        if (payment.costs.length > 0) {
          for (const cost of payment.costs) {
            if (cost.isDeleted) {continue}

            payment.amount -= cost.amount
          }
        }

        filteredAuthorPayments.set(payment.forMonth, {
          forMonth: payment.forMonth,
          status: payment.status,
          amount: payment.amount
        })
      }
    }

    let paymentsPerMonth = [];
    let keys = generateMonthKeysForRange(ltm, new Date())
    for (let i = 0; i < keys.length; i++) {
      if (filteredAuthorPayments.has(keys[keys.length - (i+1)])) {
        paymentsPerMonth.push(filteredAuthorPayments.get(keys[keys.length - (i+1)]))
      } else {
        paymentsPerMonth.push({
          forMonth: keys[keys.length - (i+1)],
          status: "created",
          amount: 0
        })
      }
    }

    // Aplicar el arrastre de saldo negativo: un mes en negativo se muestra en
    // negativo (displayAmount) y se acumula hasta volverse positivo.
    const withCarry = applyCarryOver(paymentsPerMonth);
    const finalPayments = withCarry.map((m) => ({
      ...m,
      amount: m.displayAmount,        // lo que se muestra al autor (acumulado)
      payableAmount: m.payableAmount, // lo que efectivamente se le pagaría
    }));

    res.status(200).json(finalPayments);
  } catch (error) {
    console.log("\n ERROR WHILE FETCHING PAYMENTS FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred"})
  }
}
router.get("/payments", getAuthorPayments);

export default router;