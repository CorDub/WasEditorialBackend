import express from "express";
import bcrypt from 'bcrypt';
import { prisma } from "../prisma/client.js"
import multer from "multer";
import { sendEmailWithInvoice } from "../mailer.js";
import { 
  calculateAuthorRevenue, 
  generateMonthKeysForRange, 
  getForMonth, 
  twelveMonthsAgo,
  validateInputs,
} from "../utils.js";

const upload = multer();
const router = express.Router();

export async function changePassword(req, res) {
  try {
    const password = req.body.password;
    const user_id = req.session.user_id;

    let errors = [];

    let upper = 0;
    let lower = 0;
    let number = 0;
    let special = 0;

    const prismaClient = req.prisma || prisma

    for (const char of password) {
      if (/[A-Z]/.test(char)) {
        upper += 1
      };

      if (/[a-z]/.test(char)) {
        lower += 1
      }

      if (/[0-9]/.test(char)) {
        number += 1
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(char)) {
        special += 1
      }
    }

    if (upper < 1 || lower < 1 || number <1 || special < 1) {
      errors.push(13)
    }

    if (password.length < 8) {
      errors.push(12)
    };

    const current_user = await prismaClient.user.findUnique({where: {id: user_id}});
    if (await bcrypt.compare(password, current_user.password)) {
      errors.push(14);
    }

    if (errors.length > 0) { return res.status(400).json(errors); } 

    const update = await prismaClient.user.update({
      where: {id: user_id},
      data: {password: await bcrypt.hash(password, 10)}
    });

    res.status(200).json({message: "Successfully updated password"});

  } catch(error) {
    console.error("Error at the change_password route:", error);
    res.status(500).json({error: "There was an issue updating the password."});
  }
}
router.patch('/change_password', changePassword);


export async function getAuthorInventories (req, res) {
  try {
    // Check if user is authenticated
    if (!req.session.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const prismaClient = req.prisma || prisma

    // Fetch all necessary data
    const data = await prismaClient.user.findUnique({
      where: {
        id: req.session.user_id
      },
      select: {
        first_name: true,
        last_name: true,
        books: {
          select: {
            id: true,
            title: true,
            isDeleted: true,
            inventories: {
              select: {
                initial: true,
                givenToAuthor: true,
                current: true,
                bookstoreId: true,
                isDeleted: true,
                sales: {
                  select: {
                    quantity: true,
                    isDeleted: true
                  }
                }
              }
            },
            impressions: {
              select: {
                quantity: true,
                isDeleted: true,
                date: true,
              }
            }
          }
        },
      }
    });

    //group and format data
    let overallInitialTotal = 0;
    let overallNewImpressions = 0;
    let overallSoldTotal = 0;
    let overallInventoryInBookstores = 0;
    let overallInventoryInWas = 0;
    let overallEntregadosAlAutor = 0;
    let overallRemainingTotal = 0;

    let bookInventories = [];

    for (const book of data.books) {
      if (book.isDeleted) { continue }
      let initialTotal = 0;
      let newImpressionsTotal = 0;
      let soldTotal = 0;
      let givenToAuthorTotal = 0;
      let remainingTotal = 0;
      let impressionsData = [];

      let bookstoresCopies = 0;
      let wasCopies = 0;

      for (const inventory of book.inventories) {
        if (inventory.isDeleted) { continue }

        if (inventory.bookstoreId === 1) {
          wasCopies += inventory.current
          overallInventoryInWas += inventory.current
        } else {
          bookstoresCopies += inventory.current
          overallInventoryInBookstores += inventory.current
        }

        givenToAuthorTotal += inventory.givenToAuthor
        overallEntregadosAlAutor += inventory.givenToAuthor

        remainingTotal += inventory.current
        overallRemainingTotal += inventory.current

        for (const sale of inventory.sales) {
          if (sale.isDeleted) { continue }

          soldTotal += sale.quantity
          overallSoldTotal += sale.quantity
        }
      }

      for (const impression of book.impressions) {
        if (impression.isDeleted) {
          continue
        } else {
          initialTotal += impression.quantity
          overallInitialTotal += impression.quantity
          impressionsData.push({
            quantity: impression.quantity,
            date: impression.date
          })
          break;
        } 
      }

      if (book.impressions.length > 1) {
        for (const impression of book.impressions.slice(1)) {
          if (impression.isDeleted) { continue }

          newImpressionsTotal += impression.quantity
          overallNewImpressions += impression.quantity
          impressionsData.push({
            quantity: impression.quantity,
            date: impression.date
          })
        }
      }

      bookInventories.push({
        bookId: book.id,
        title: book.title,
        summary: {
          bookstores: bookstoresCopies,
          was: wasCopies,
          givenToAuthor: givenToAuthorTotal,
          initial: initialTotal,
          impressions: newImpressionsTotal,
          sold: soldTotal,
          total: remainingTotal
        },
        impressions: impressionsData
      })
    }

    const packagedData = {
      summary: {
        initial: overallInitialTotal,
        impressions: overallNewImpressions,
        sold: overallSoldTotal,
        givenToAuthor: overallEntregadosAlAutor,
        total: overallRemainingTotal,
        bookstores: overallInventoryInBookstores,
        was: overallInventoryInWas
      },
      bookInventories: bookInventories,
    }

    res.status(200).json(packagedData);
  } catch(error) {
    console.log("Error in the home route:",  error);
    res.status(500).json({error: 'A server error occurred while fetching inventory data'});
  }
}
router.get('/inventories', getAuthorInventories);



export async function getAuthorSales (req, res) {
  try {
    // Validate all inputs
    if (!req.session.user_id) {return res.status(401).json({message: "Unauthorized"});}
    const inputs = {
      startDate: req.query.startDate ? new Date(req.query.startDate) : twelveMonthsAgo(),
      endDate: req.query.endDate ? new Date(req.query.endDate) : new Date()
    }
    validateInputs(inputs);
    if (inputs.startDate >= inputs.endDate) {
      return res.status(400).json({message: "The start date cannot come after the end date"})
    }

    const prismaClient = req.prisma || prisma

    // Get data
    let salesInRange = await prismaClient.sale.findMany({
      where: {
        payments: {
          some: {
            userId: req.session.user_id
          }
        },
        isDeleted: false,
        date: {
          gte: inputs.startDate,
          lte: inputs.endDate
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
        date: "desc"
      }
    });

    const kindleSalesInRange = await prismaClient.kindleSale.findMany({
      where: {
        payments: {
          some: {
            userId: req.session.user_id
          }
        },
        isDeleted: false,
        datePay: {
          gte: inputs.startDate,
          lte: inputs.endDate
        }
      },
      include: {
        payments: true,
        book: true
      },
      orderBy: {
        datePay: 'desc'
      }
    });

    // const author = await prismaClient.user.findUnique({
    //   where: {
    //     id: req.session.user_id
    //   }
    // });

    //Format data
    let totalSales = 0;
    let totalValue = 0;
    let salesByBook = new Map();
    let sales = [];


    //Start with sales
    for (const sale of salesInRange) {
      // const saleValue = calculateAuthorRevenue(
      //   sale.inventory.bookstore.comissions,
      //   sale.inventory.price,
      //   author.category.management_min,
      //   sale.inventory.bookstore.deal_percentage,
      //   sale.quantity
      // )
      const saleValue = calculateAuthorRevenue(
        sale.inventory.book.category.category_type,
        sale.inventory.price,
        sale.inventory.bookstore.deal_percentage,
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
        date: sale.date,
        id: sale.id,
        quantity: sale.quantity,
        title: sale.inventory.book.title,
        value: saleValue
      })
    }

    // Add kindleSales
    for (const kindleSale of kindleSalesInRange) {
      totalSales += kindleSale.quantityPod + kindleSale.quantityEbook;
      totalValue += kindleSale.regalias

      if (salesByBook.has(kindleSale.book.title)) {
        const targetedBook = salesByBook.get(kindleSale.book.title);
        targetedBook.quantity += kindleSale.quantityPod + kindleSale.quantityEbook;
        targetedBook.value += kindleSale.regalias;
      } else {
        salesByBook.set(kindleSale.book.title, {
          "bookId": kindleSale.bookId,
          "title": kindleSale.book.title,
          "quantity": kindleSale.quantityPod + kindleSale.quantityEbook,
          "value": kindleSale.regalias,
        }) 
      }

      sales.push({
        book_id: kindleSale.bookId,
        date: kindleSale.datePay,
        id: kindleSale.id,
        quantity: kindleSale.quantityEbook + kindleSale.quantityPod,
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


export async function getMonthlySalesByPayments (req, res) {
  try {
    // Get the last twelfth month first day as a cutoff date
    if (!req.session.user_id) {
      return res.status(401).json({message: "Unauthorized"})
    }

    const prismaClient = req.prisma || prisma

    const ltm = new Date();
    ltm.setMonth(ltm.getMonth()-12);
    ltm.setDate(1);

    const user = await prismaClient.user.findUnique({
      where: {
        id: req.session.user_id
      }
    })

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
            dateCut: true,
            datePay: true,
            regalias: true
          }
        },
        costs: {
          select: {
            id: true,
            amount: true,
            note: true,
            isDeleted: true
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
              "comissions": sale.inventory.bookstore.comissions 
                ? user.category.management_min
                : sale.inventory.price * (sale.inventory.bookstore.deal_percentage / 100),
              "ganancia": sale.inventory.bookstore.comissions
                ? sale.inventory.price - user.category.management_min
                : sale.inventory.price - sale.inventory.price 
                  * (sale.inventory.bookstore.deal_percentage / 100)
            }],
            "totalTitleQuantity": sale.quantity,
            "totalTitleValue": sale.inventory.bookstore.comissions
              ? sale.quantity * (sale.inventory.price - user.category.management_min)
              : sale.quantity * 
                (sale.inventory.price - sale.inventory.price 
                  * (sale.inventory.bookstore.deal_percentage / 100))
          })

          paymentSales.totalQuantity += sale.quantity
          paymentSales.totalValue += sale.inventory.bookstore.comissions
            ? sale.quantity * (sale.inventory.price - user.category.management_min)
            : sale.quantity * 
              (sale.inventory.price - sale.inventory.price 
                * (sale.inventory.bookstore.deal_percentage / 100))
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
                  entry.totalTitleValue += sale.inventory.bookstore.comissions
                    ? sale.quantity * (sale.inventory.price - user.category.management_min)
                    : sale.quantity * 
                      (sale.inventory.price - sale.inventory.price 
                        * (sale.inventory.bookstore.deal_percentage / 100))
                  existingBookstore = true;
              }
            }

            /// if not we create it
            if (!existingBookstore) {
              entry.bookstores.push({
                "name": sale.inventory.bookstore.name,
                "quantity": sale.quantity,
                "price": sale.inventory.price,
                "isComissions": sale.inventory.bookstore.comissions,
                "deal_percentage": sale.inventory.bookstore.deal_percentage,
                "comissions": sale.inventory.bookstore.comissions 
                  ? user.category.management_min
                  : sale.inventory.price * (sale.inventory.bookstore.deal_percentage / 100),
                "ganancia": sale.inventory.bookstore.comissions
                  ? sale.inventory.price - user.category.management_min
                  : sale.inventory.price - sale.inventory.price 
                    * (sale.inventory.bookstore.deal_percentage / 100)
              })

              // and we update total quantity and value for the entry
              entry.totalTitleQuantity += sale.quantity;
              entry.totalTitleValue += sale.inventory.bookstore.comissions
                ? sale.quantity * (sale.inventory.price - user.category.management_min)
                : sale.quantity * 
                  (sale.inventory.price - sale.inventory.price 
                    * (sale.inventory.bookstore.deal_percentage / 100))
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
              "isComissions": sale.inventory.bookstore.comissions,
              "deal_percentage": sale.inventory.bookstore.deal_percentage,
              "comissions": sale.inventory.bookstore.comissions 
                ? user.category.management_min
                : sale.inventory.price * (sale.inventory.bookstore.deal_percentage / 100),
              "ganancia": sale.inventory.bookstore.comissions
                ? sale.inventory.price - user.category.management_min
                : sale.inventory.price - sale.inventory.price 
                  * (sale.inventory.bookstore.deal_percentage / 100)
            }],
            "totalTitleQuantity": sale.quantity,
            "totalTitleValue": sale.inventory.bookstore.comissions
              ? sale.quantity * (sale.inventory.price - user.category.management_min)
              : sale.quantity * 
                (sale.inventory.price - sale.inventory.price 
                  * (sale.inventory.bookstore.deal_percentage / 100))
          })
        }

        // and update totalQuantity and totalValue
        paymentSales.totalQuantity += sale.quantity
        paymentSales.totalValue += sale.inventory.bookstore.comissions
          ? sale.quantity * (sale.inventory.price - user.category.management_min)
          : sale.quantity * 
            (sale.inventory.price - sale.inventory.price 
              * (sale.inventory.bookstore.deal_percentage / 100))
      }

      //Now we're adding the costs 
      for (const cost of payment.costs) {
        if (cost.isDeleted === false) {
          paymentSales.costs.push({"amount": cost.amount, "note": cost.note})
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
              "dateCut": kindleSale.dateCut,
              "datePay": kindleSale.datePay,
              "regalias": kindleSale.regalias
            }],
            "totalTitleQuantity": (kindleSale.quantityEbook + kindleSale.quantityPod),
            "totalTitleValue": kindleSale.regalias
          })

          paymentSales.totalQuantity += (kindleSale.quantityEbook + kindleSale.quantityPod)
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
                  entry.totalTitleQuantity += (kindleSale.quantityEbook + kindleSale.quantityPod);
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
                "dateCut": kindleSale.dateCut,
                "datePay": kindleSale.datePay,
                "regalias": kindleSale.regalias
              })

              // and we update total quantity and value for the entry
              entry.totalTitleQuantity += (kindleSale.quantityEbook + kindleSale.quantityPod);
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
              "dateCut": kindleSale.dateCut,
              "datePay": kindleSale.datePay,
              "regalias": kindleSale.regalias
            }],
            "totalTitleQuantity": (kindleSale.quantityEbook + kindleSale.quantityPod),
            "totalTitleValue": kindleSale.regalias
          })
        }

        paymentSales.totalQuantity += (kindleSale.quantityEbook + kindleSale.quantityPod)
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



export async function getAuthorPayments (req, res) {
  try {
    if (!req.session.user_id) {
      return res.status(401).json({message: "Unauthorized"})
    }

    const prismaClient = req.prisma || prisma

    // Getting our range ready by setting it 12m ago
    const ltm = new Date();
    ltm.setMonth(ltm.getMonth()-12);
    ltm.setDate(1);

    // Getting all payments from that date to now
    const allPayments = await prismaClient.payment.findMany({
      where: {
        isDeleted: false,
        userId: req.session.user_id,
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

    const userWithCategory = await prismaClient.user.findUnique({
      where: {
        id: req.session.user_id
      }
    })

    let filteredAuthorPayments = new Map();
    for (const payment of allPayments) {
      const forMonthDate = new Date(payment.forMonth + "-01")
      if (forMonthDate >= ltm && !payment.isDeleted) {
        payment.amount  = 0

        if (payment.sales.length > 0) {
          for (const sale of payment.sales) {
            if (sale.isDeleted) {continue}

            // payment.amount += calculateAuthorRevenue(
            //   sale.inventory.bookstore.comissions,
            //   sale.inventory.price,
            //   userWithCategory.category.management_min,
            //   sale.inventory.bookstore.deal_percentage,
            //   sale.quantity
            // )
            payment.amout += calculateAuthorRevenue(
              sale.inventory.book.category.category_type,
              sale.inventory.price,
              sale.inventory.bookstore.deal_percentage,
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

    res.status(200).json(paymentsPerMonth);
  } catch (error) {
    console.log("\n ERROR WHILE FETCHING PAYMENTS FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred"})
  }
}
router.get("/payments", getAuthorPayments);



export async function sendInvoice(req, res) {
  try {
    if (!req.session.user_id) {
      return res.status(401).json({message: "Unauthorized"})
    }

    const prismaClient = req.prisma || prisma;

    const userID = req.session.user_id;
    const user = await prismaClient.user.findUnique({
      where: {
        id: userID,
      }
    });

    const inputs = {
      month: req.body.month,
      monthOriginal: req.body.monthOriginal,
      amount: parseFloat(req.body.amount),
      email: user.email,
      factura: req.files.factura[0],
      constancia: req.files.constancia[0]
    }
    validateInputs(inputs)

    const payment = await prismaClient.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: user.id,
          forMonth: inputs.monthOriginal
        }
      }
    })
    if (!payment || payment.status === "solicited" || payment.status === "paid") {
      throw new Error ({error: "invalid payment"})
    }

    const name = user.first_name + " " + user.last_name;
    const info = await sendEmailWithInvoice(
      name, 
      inputs.month, 
      inputs.amount, 
      inputs.factura, 
      inputs.constancia, 
      inputs.email);
    
    if (!info.accepted.includes(inputs.email)) {
      throw new Error ({error: "email was not sent successfully"})
    }

    const updatedPayment = await prismaClient.payment.update({
      where: {
        userId_forMonth: {
          userId: userID,
          forMonth: inputs.monthOriginal
        }
      },
      data: {
        status: "solicited"
      }
    })
    res.status(200).json({message: "invoice sent successfully"})
  } catch (error) {
    console.error("\n ERROR WHILE SENDING INVOICE \n", error);
    res.status(500).json({error: "a server error occurred while sending the invoice"})
  }
}
router.post("/sendInvoice", upload.fields([
  { name: "factura", maxCount: 1},
  { name: "constancia", maxCount: 1}
]), sendInvoice)



export async function getCompleteInventory(req, res) {
  try {
    if (!req.session.user_id) {
      return res.status(401).json({message: "Unauthorized"})
    }

    const prismaClient = req.prisma || prisma

    const allAuthorInventories = await prismaClient.inventory.findMany({
      where: {
        isDeleted: false,
        book: {
          users: {
            some: {
              id: req.session.user_id
            }
          }
        }
      },
      select: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
        bookstore: {
          select: {
            id: true,
            name: true,
          }
        },
        country: true,
        price: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          select: {
            isDeleted: true,
            quantity: true
          }
        }
      }
    });

    let inventoriesWithSales = [];
    for (const inventory of allAuthorInventories) {
      let totalSold = 0;
      for (const sale of inventory.sales) {
        if (sale.isDeleted) {continue}

        totalSold += sale.quantity
      }

      inventoriesWithSales.push({
        book: {
          id: inventory.book.id,
          title: inventory.book.title 
        },
        bookstore: {
          id: inventory.bookstore.id,
          name: inventory.bookstore.name
        },
        country: inventory.country,
        current: inventory.current,
        givenToAuthor: inventory.givenToAuthor,
        returns: inventory.returns,
        sold: totalSold
      })
    }
    
    res.status(200).json(inventoriesWithSales);
  } catch (error) {
    console.log("\n ERROR WHILE FETCHING PAYMENTS FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred while fetching the complete inventory status of the author"})
  }
}
router.get("/completeInventory", getCompleteInventory)


export default router;
