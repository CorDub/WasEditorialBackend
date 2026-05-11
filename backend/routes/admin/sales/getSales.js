import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  localISODateTwelveMonthsAgo, 
  validateInputs,
  generateMonthKeysForRangeStr 
} from "../../../utils.js" 
const router = express.Router();

export async function getSales(req, res) {
  try {
    const inputs = {
      startDateStr: req.query.startDate ? req.query.startDate : localISODateTwelveMonthsAgo(),
      endDateStr: req.query.endDate ? req.query.endDate : today()
    };
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const sales = await prismaClient.sale.findMany({
      where: {
        isDeleted: false,
        dateStr: {
          gte: inputs.startDateStr,
          lte: inputs.endDateStr
        }
      },
      select: {
        id: true,
        inventoryId: true,
        inventory: {
          select: {
            bookId: true,
            book: {
              select: {
                title: true,
                users: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true
                  }
                }
              }
            },
            bookstoreId: true,
            bookstore: {
              select: {
                name: true,
                deal_percentage: true
              }
            },
            country: true,
            price: true,
            initial: true
          }
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
        dateStr: true
      },
      orderBy: {
        dateStr: "desc"
      }
    });

    sales.map((sale) => {
      sale.completeInventory = sale.inventory.book.title + ", " + sale.inventory.bookstore.name
      sale.createdAt = sale.createdAt.toLocaleString();
      sale.updatedAt = sale.updatedAt.toLocaleString();
      // sale.date = sale.date.toLocaleString();
      sale.dateStr = sale.dateStr.toLocaleString();
      sale.authorsString = getAuthorString(sale.inventory.book.users);
    })

    const monthsRange = generateMonthKeysForRangeStr(inputs.startDateStr, inputs.endDateStr)
    let salesCompiled = [];
    for (const month of monthsRange) {
      salesCompiled.push(
        {
          "forMonth" : month,
          "sales": [],
          "total": 0,
          "bookstores": [],
          "books": [],
          "authors": []
        }
      )
    }
    for (const sale of sales) {
      for (const month of salesCompiled) {
        if (getForMonth(sale.dateStr) === month.forMonth) {
          month.sales.push(sale);
          month.total += sale.quantity

          if (!month.bookstores.includes(sale.inventory.bookstore.name)) {
            month.bookstores.push(sale.inventory.bookstore.name)
          }
          month.bookstores.sort()

          if (!month.books.includes(sale.inventory.book.title)) {
            month.books.push(sale.inventory.book.title)
          }
          month.books.sort()

          for (const author of sale.inventory.book.users) {
            if (!month.authors.includes( (author.first_name + " " + author.last_name) )) {
              month.authors.push( (author.first_name + " " + author.last_name) )
            }
          }
          month.authors.sort()
        }
      }
    }

    res.status(200).json(salesCompiled);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at sales route"});
  }
}
router.get('/sales', getSales);

export default router;