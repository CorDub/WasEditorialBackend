import express from "express";
import { prisma } from "../../../prisma/client.js";
import {
  calculateBookstoreComission,
  calculateAuthorRevenue,
  generateMonthKeysForRange,
} from "../../../utils.js"
const router = express.Router();

export async function getMonthlySalesByPayments (req, res) {
  try {
    if (!req.session.user_id) {
      return res.status(401).json({message: "Unauthorized"})
    }

    const prismaClient = req.prisma || prisma

    const ltm = new Date();
    ltm.setMonth(ltm.getMonth()-12);
    ltm.setDate(1);

    // Get all existing payments and tied sales for that author
    const allAuthorPayments = await prismaClient.payment.findMany({
      where: {
        userId: req.session.user_id,
        createdAt: {
          gte: ltm
        }
      },
      select: {
        forMonth: true,
        createdAt: true,
        sales: {
          select: {
            quantity: true,
            isDeleted: true,
            inventory: {
              select: {
                bookstore: {
                  select: {
                    id: true,
                    name: true,
                    deal_percentage: true
                  }
                },
                book: {
                  select: {
                    title: true,
                    category: {
                      select: {
                        category_type: true,
                        percentage_royalties: true,
                        rebate_author: true,
                        percentage_management_stores: true,
                        management_min: true,
                      }
                    }
                  }
                },
                price: true
              }
            }
          }
        },
        kindleSales: {
          select: {
            book: {
              select: {
                title: true
              }
            },
            isDeleted: true,
            id: true,
            quantityEbook: true,
            quantityPod: true,
            dateCutStr: true,
            datePayStr: true,
            regalias: true
          }
        },
        costs: {
          select: {
            id: true,
            amount: true,
            note: true,
            isDeleted: true,
            dateStr: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    let filteredAuthorPayments = [];
    for (const payment of allAuthorPayments) {
      const forMonthDate = new Date(payment.forMonth + "-01")
      if (forMonthDate >= ltm) {
        filteredAuthorPayments.push(payment)
      }
    }

    let monthlySales = [];
    for (const payment of filteredAuthorPayments) {
      let paymentSales = {
        "forMonth": payment.forMonth,
        "sales": [],
        "totalQuantity": 0,
        "totalValue": 0,
        "costs": [],
      }

      for (const sale of payment.sales) {
        if (sale.isDeleted === true) {
          continue;
        }

        const saleBookstoreComission = calculateBookstoreComission(
          sale.inventory.book.category.category_type,
          sale.inventory.price,
          sale.inventory.bookstore.deal_percentage,
          sale.inventory.bookstore.id,
          sale.inventory.book.category.percentage_royalties,
          sale.inventory.book.category.percentage_management_stores,
          sale.inventory.book.category.management_min
        )
        const saleAuthorGanancia = sale.inventory.price - saleBookstoreComission

        const saleValue = calculateAuthorRevenue(
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

        /// if we have nothing in the array we start it so that we can go through it
        /// with a for loop later on
        if (paymentSales.sales.length === 0) {
          paymentSales.sales.push({
            "title": sale.inventory.book.title,
            "bookstores": [{
              "name": sale.inventory.bookstore.name,
              "quantity": sale.quantity,
              "price": sale.inventory.price,
              "isComissions": sale.inventory.book.category_type === "comissions" ? true : false,
              "deal_percentage": sale.inventory.bookstore.deal_percentage,
              "comissions": saleBookstoreComission,
              "ganancia": saleAuthorGanancia,
            }],
            "totalTitleQuantity": sale.quantity,
            "totalTitleValue": saleValue
          })

          paymentSales.totalQuantity += sale.quantity
          paymentSales.totalValue += saleValue
          continue;
        }

        /// if the array isn't empty we go through it to find a matching title
        let existingBook = false;
        for (const entry of paymentSales.sales) {
          if (entry.title === sale.inventory.book.title) {

            // if we match we check if the bookstore for this book has already been included
            let existingBookstore = false;
            for (const bookstore of entry.bookstores) {

              /// if it does we update
              if (bookstore.name === sale.inventory.bookstore.name) {
                  bookstore.quantity += sale.quantity;
                  entry.totalTitleQuantity += sale.quantity;
                  entry.totalTitleValue += saleValue;
                  existingBookstore = true;
              }
            }

            /// if not we create it
            if (!existingBookstore) {
              entry.bookstores.push({
                "name": sale.inventory.bookstore.name,
                "quantity": sale.quantity,
                "price": sale.inventory.price,
                "isComissions": sale.inventory.book.category_type === "comissions" ? true : false,
                "deal_percentage": sale.inventory.bookstore.deal_percentage,
                "comissions": saleBookstoreComission,
                "ganancia": saleAuthorGanancia
              })
              // and we update total quantity and value for the entr
              entry.totalTitleQuantity += sale.quantity;
              entry.totalTitleValue += saleValue
            }

            existingBook = true;
          }
        }

        // if the book isn't found amongst the entries we create it
        if (!existingBook) {
          paymentSales.sales.push({
            "title": sale.inventory.book.title,
            "bookstores": [{
              "name": sale.inventory.bookstore.name,
              "quantity": sale.quantity,
              "price": sale.inventory.price,
              "isComissions": sale.inventory.book.category_type === "comissions" ? true : false,
              "deal_percentage": sale.inventory.bookstore.deal_percentage,
              "comissions": saleBookstoreComission,
              "ganancia": saleAuthorGanancia
            }],
            "totalTitleQuantity": sale.quantity,
            "totalTitleValue": saleValue
          })
        }

        // and update totalQuantity and totalValue
        paymentSales.totalQuantity += sale.quantity
        paymentSales.totalValue += saleValue
      }

      //Now we're adding the costs
      for (const cost of payment.costs) {
        if (cost.isDeleted === false) {
          paymentSales.costs.push({"amount": cost.amount, "note": cost.note, "dateStr": cost.dateStr})
          paymentSales.totalValue -= cost.amount
        }
      }

      //Now we're adding the kindle sales
      for (const kindleSale of payment.kindleSales) {
        if (kindleSale.isDeleted === true) {
          continue;
        }

        //same steps than sales
        // if the month is empty we create it
        if (paymentSales.sales.length === 0) {
          paymentSales.sales.push({
            "title": kindleSale.book.title,
            "bookstores": [{
              "name": "Kindle",
              "quantity": (kindleSale.quantityEbook + kindleSale.quantityPod),
              "ganancia": kindleSale.regalias,
              "quantityEbook": kindleSale.quantityEbook,
              "quantityPod": kindleSale.quantityPod,
              "dateCutStr": kindleSale.dateCutStr,
              "datePayStr": kindleSale.datePayStr,
              "regalias": kindleSale.regalias
            }],
            // "totalTitleQuantity": (kindleSale.quantityEbook + kindleSale.quantityPod),
            "totalTitleValue": kindleSale.regalias
          })

          // paymentSales.totalQuantity += (kindleSale.quantityEbook + kindleSale.quantityPod)
          paymentSales.totalValue += kindleSale.regalias;
          continue;
        }

        /// if the array isn't empty we go through it to find a matching title
        let existingBook = false;
        for (const entry of paymentSales.sales) {
          if (entry.title === kindleSale.book.title) {

            // if we match we check if the bookstore for this book has already been included
            let existingBookstore = false;
            for (const bookstore of entry.bookstores) {

              /// if it does we update
              if (bookstore.name === "Kindle") {
                  bookstore.quantity += (kindleSale.quantityEbook + kindleSale.quantityPod);
                  bookstore.regalias += kindleSale.regalias;
                  // entry.totalTitleQuantity += (kindleSale.quantityEbook + kindleSale.quantityPod);
                  entry.totalTitleValue += kindleSale.regalias;
                  existingBookstore = true;
              }
            }

            /// if not we create it
            if (!existingBookstore) {
              entry.bookstores.push({
                "name": "Kindle",
                "quantity": (kindleSale.quantityEbook + kindleSale.quantityPod),
                "ganancia": kindleSale.regalias,
                "quantityEbook": kindleSale.quantityEbook,
                "quantityPod": kindleSale.quantityPod,
                "dateCutStr": kindleSale.dateCutStr,
                "datePayStr": kindleSale.datePayStr,
                "regalias": kindleSale.regalias
              })

              // and we update total quantity and value for the entry
              // entry.totalTitleQuantity += (kindleSale.quantityEbook + kindleSale.quantityPod);
              entry.totalTitleValue += kindleSale.regalias
            }
            existingBook = true;
          }
        }

        if (!existingBook) {
          paymentSales.sales.push({
            "title": kindleSale.book.title,
            "bookstores": [{
              "name": "Kindle",
              "quantity": (kindleSale.quantityEbook + kindleSale.quantityPod),
              "ganancia": kindleSale.regalias,
              "quantityEbook": kindleSale.quantityEbook,
              "quantityPod": kindleSale.quantityPod,
              "dateCutStr": kindleSale.dateCutStr,
              "datePayStr": kindleSale.datePayStr,
              "regalias": kindleSale.regalias
            }],
            // "totalTitleQuantity": (kindleSale.quantityEbook + kindleSale.quantityPod),
            "totalTitleValue": kindleSale.regalias
          })
        }

        // paymentSales.totalQuantity += (kindleSale.quantityEbook + kindleSale.quantityPod)
        paymentSales.totalValue += kindleSale.regalias
      }

      monthlySales.push(paymentSales);
    }

    let paddedMonthlySales = []
    if (monthlySales.length < 13) {
      let keys = generateMonthKeysForRange(ltm, new Date())
      for (let i = 0; i < keys.length; i++) {
        const existingPayment = monthlySales.find(payment => payment.forMonth === keys[keys.length - (i+1)])
        if (existingPayment) {
          paddedMonthlySales.push(existingPayment)
          continue
        } else {
          paddedMonthlySales.push({
            "forMonth": keys[keys.length - (i+1)],
            "sales": [],
            "costs": []
          })
        }
      }
    }

    res.status(200).json(paddedMonthlySales);
  } catch (error) {
    console.log('error fetching monthly sales by payments', error)
    res.status(500).json({error: 'Internal server error'});
  }
}
router.get('/monthlySalesByPayments', getMonthlySalesByPayments);

export default router;