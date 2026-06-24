import express from "express";
import { prisma } from "../../../prisma/client.js";
import {
  validateInputs,
  calculateAuthorRevenue
} from "../../../utils.js";
import { applyCarryOver } from "./carryOverBalance.js";
const router = express.Router();

export async function getPayments(req, res) {
  try {
    const inputs = {
      status: req.query.status
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    // Traemos TODOS los pagos no borrados (no solo el estado pedido) porque el
    // arrastre de saldo negativo necesita ver el historial completo de cada
    // autor en orden cronológico para acumular correctamente.
    const selectedPayments = await prismaClient.payment.findMany({
      where: {
        isDeleted: false
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

    // 1) Calcular el balance crudo de cada mes
    await Promise.all(selectedPayments.map(payment => updateAmount(payment)));

    // 2) Agrupar por autor y aplicar el arrastre de saldo negativo por autor
    const byUser = new Map();
    for (const payment of selectedPayments) {
      if (!byUser.has(payment.userId)) byUser.set(payment.userId, []);
      byUser.get(payment.userId).push(payment);
    }
    for (const [, userPayments] of byUser) {
      const withCarry = applyCarryOver(userPayments);
      // applyCarryOver preserva el orden, así que mapeamos por índice
      withCarry.forEach((m, i) => {
        userPayments[i].rawAmount = m.rawAmount;
        userPayments[i].displayAmount = m.displayAmount;   // saldo acumulado (puede ser negativo)
        userPayments[i].payableAmount = m.payableAmount;   // lo que se paga (0 si negativo)
        // 'amount' = lo que efectivamente se paga, para no romper el frontend existente
        userPayments[i].amount = m.payableAmount;
      });
    }

    // 3) Devolver solo los pagos del estado pedido.
    //    Mostramos los que tienen un monto a pagar (payableAmount > 0) o un
    //    saldo arrastrado distinto de 0 (para que el negativo sea visible).
    const paymentsSent = selectedPayments.filter(
      (p) => p.status === inputs.status &&
             (p.payableAmount > 0 || p.displayAmount !== 0)
    );

    // total = suma de lo efectivamente pagable de los mostrados
    let totalAmount = 0;
    for (const payment of paymentsSent) {
      totalAmount += payment.payableAmount;
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