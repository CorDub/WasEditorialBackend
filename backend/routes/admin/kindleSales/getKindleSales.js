import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
  generateMonthKeysForRangeStr,
  getAuthorString,
  getForMonthStr
} from "../../../utils.js";
const router = express.Router();

export async function getKindleSales(req, res) {
  try {
    const inputs = {
      startDateStr: req.query.startDate,
      endDateStr: req.query.endDate
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    const kindleSales = await prismaClient.kindleSale.findMany({
      where: {
        isDeleted: false,
        datePayStr: {
          gte: inputs.startDateStr,
          lte: inputs.endDateStr
        }
      },
      select: {
        id: true,
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
        quantityEbook: true,
        quantityPod: true,
        dateCutStr: true,
        datePayStr: true,
        regalias: true,
      },
      orderBy: {
        datePayStr: "desc"
      }
    });

    kindleSales.map((kindleSale) => {
      kindleSale.authorsString = getAuthorString(kindleSale.book.users);
    })

    const monthsRange = generateMonthKeysForRangeStr(inputs.startDateStr, inputs.endDateStr)
    let kindleSalesCompiled = [];
    for (const month of monthsRange) {
      kindleSalesCompiled.push(
        {
          "forMonth" : month,
          "sales": [],
          "books": [],
          "authors": []
        }
      )
    }
    for (const kindleSale of kindleSales) {
      for (const month of kindleSalesCompiled) {
        if (getForMonthStr(kindleSale.datePayStr) === month.forMonth) {
          month.sales.push(kindleSale);

          if (!month.books.includes(kindleSale.book.title)) {
            month.books.push(kindleSale.book.title)
          }
          month.books.sort()

          for (const author of kindleSale.book.users) {
            if (!month.authors.includes( (author.first_name + " " + author.last_name) )) {
              month.authors.push( (author.first_name + " " + author.last_name) )
            }
          }
          month.authors.sort()
        }
      }
    }

    res.status(200).json(kindleSalesCompiled);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at sales route"});
  }
}
router.get('/kindlesales', getKindleSales);

export default router;