import express from "express";
import { prisma } from "../../../prisma/client.js";
import {
  localISODateTwelveMonthsAgo,
  today,
  validateInputs,
  calculateAuthorRevenue
} from "../../../utils.js";
import { resolveAuthorId } from "../resolveAuthorId.js";
const router = express.Router();

export async function getAuthorSales (req, res) {
  try {
    // Validate all inputs
    if (!req.session.user_id) {return res.status(401).json({message: "Unauthorized"});}
    const authorId = await resolveAuthorId(req);
    const inputs = {
      startDateStr: req.query.startDateStr ? req.query.startDateStr : localISODateTwelveMonthsAgo(),
      endDateStr: req.query.endDateStr ? req.query.endDateStr : today()
    }
    validateInputs(inputs);
    if (inputs.startDateStr >= inputs.endDateStr) {
      return res.status(400).json({message: "The start date cannot come after the end date"})
    }

    const prismaClient = req.prisma || prisma
    // inputs.endDate.setUTCHours(23,59,59,999);

    // Get data
    let salesInRange = await prismaClient.sale.findMany({
      where: {
        payments: {
          some: {
            userId: authorId
          }
        },
        isDeleted: false,
        dateStr: {
          gte: inputs.startDateStr,
          lte: inputs.endDateStr
        }
      },
      include: {
        inventory: {
          include: {
            book: {
              include: {
                category: true
              }
            },
            bookstore: true
          }
        },
        payments: true
      },
      orderBy: {
        dateStr: "desc"
      }
    });

    const kindleSalesInRange = await prismaClient.kindleSale.findMany({
      where: {
        payments: {
          some: {
            userId: authorId
          }
        },
        isDeleted: false,
        datePayStr: {
          gte: inputs.startDateStr,
          lte: inputs.endDateStr
        }
      },
      include: {
        payments: true,
        book: true
      },
      orderBy: {
        datePayStr: 'desc'
      }
    });

    //Format data
    let totalSales = 0;
    let totalValue = 0;
    let salesByBook = new Map();
    let sales = [];


    //Start with sales
    for (const sale of salesInRange) {
      const saleValue = calculateAuthorRevenue(
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

      totalSales += sale.quantity
      totalValue += saleValue

      if (salesByBook.has(sale.inventory.book.title)) {
        const targetedBook = salesByBook.get(sale.inventory.book.title)
        targetedBook.quantity += sale.quantity
        targetedBook.value += saleValue
      } else {
        salesByBook.set(sale.inventory.book.title, {
          "bookId": sale.inventory.book.id,
          "title": sale.inventory.book.title,
          "quantity": sale.quantity,
          "value": saleValue,
        })
      }

      sales.push({
        book_id: sale.inventory.bookId,
        dateStr: sale.dateStr,
        id: sale.id,
        quantity: sale.quantity,
        title: sale.inventory.book.title,
        value: saleValue
      })
    }

    // Add kindleSales
    for (const kindleSale of kindleSalesInRange) {
      // totalSales += kindleSale.quantityPod + kindleSale.quantityEbook;
      totalValue += kindleSale.regalias

      if (salesByBook.has(kindleSale.book.title)) {
        const targetedBook = salesByBook.get(kindleSale.book.title);
        // targetedBook.quantity += kindleSale.quantityPod + kindleSale.quantityEbook;
        targetedBook.value += kindleSale.regalias;
      } else {
        salesByBook.set(kindleSale.book.title, {
          "bookId": kindleSale.bookId,
          "title": kindleSale.book.title,
          // "quantity": kindleSale.quantityPod + kindleSale.quantityEbook,
          "value": kindleSale.regalias,
        })
      }

      sales.push({
        book_id: kindleSale.bookId,
        dateStr: kindleSale.datePayStr,
        id: kindleSale.id,
        // quantity: kindleSale.quantityEbook + kindleSale.quantityPod,
        value: kindleSale.regalias
      })
    }

    const finalPayload = {
      totalSales: totalSales,
      totalValue: totalValue,
      bookSales: [...salesByBook.values()],
      sales: sales
    }

    res.status(200).json(finalPayload)
  } catch(error) {
    console.log("Error fetching sales: ", error)
    res.status(500).json({message: "Internal server error"})
  }
}
router.get('/sales', getAuthorSales)

export default router;