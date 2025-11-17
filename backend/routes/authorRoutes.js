import express from "express";
import bcrypt from 'bcrypt';
import { prisma } from "../prisma/client.js"
import multer from "multer";
import { sendEmailWithInvoice } from "../mailer.js";
import { 
  calculateAuthorRevenue, 
  getForMonth, 
  twelveMonthsAgo,
  validateInputs 
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

    const current_user = await prisma.user.findUnique({where: {id: user_id}});
    if (await bcrypt.compare(password, current_user.password)) {
      errors.push(14);
    }

    if (errors.length > 0) { return res.status(400).json(errors); } 

    const update = await prisma.user.update({
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

    // Fetch all necessary data
    const data = await prisma.user.findUnique({
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
    if (!req.session.user_id) {return res.status(401).json({message: "Unauthorized"});}

    const authorId = req.session.user_id;
    // Get date range from query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate) : twelveMonthsAgo();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const inputs = {
      startDate: startDate,
      endDate: endDate
    }
    validateInputs(inputs);
    if (startDate >= endDate) {
      return res.status(400).json({message: "The start date cannot come after the end date"})
    }

    let allSales = await prisma.sale.findMany({
      where: {
        payments: {
          some: {
            userId: authorId
          }
        },
        date: {
          gte: startDate,
          lte: endDate
        },
        isDeleted: false
      },
      include: {
        inventory: {
          include: {
            book: true,
            bookstore: true
          }
        },
        payments: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    let totalSales = 0;
    let totalValue = 0;
    let bookSalesHashMap = {};
    let sales = [];
    const author = await prisma.user.findUnique({
      where: {
        id: authorId
      },
      select: {
        category: {
          select: {
            percentage_management_stores: true,
            percentage_royalties: true,
            management_min: true,
          }
        }
      }
    })

    

    for (const sale of allSales) {
      const saleValue = calculateAuthorRevenue(
        sale.inventory.bookstore.comissions,
        sale.inventory.price,
        author.category.management_min,
        sale.inventory.bookstore.deal_percentage,
        sale.quantity,
      )

      totalSales += sale.quantity
      totalValue += saleValue
      sales.push({
        id: sale.id,
        book_id: sale.inventory.book.id,
        bookstore_id: sale.inventory.bookstore.id,
        quantity: sale.quantity,
        date: sale.date,
        title: sale.inventory.book.title,
        bookstore_name: sale.inventory.bookstore.name,
        price: sale.inventory.price,
        value: saleValue
      })

      if (!bookSalesHashMap[sale.inventory.book.title]) {
        bookSalesHashMap[sale.inventory.book.title] = {
          "bookId": sale.inventory.book.id,
          "title": sale.inventory.book.title,
          "quantity": sale.quantity,
          "value": saleValue,
          "price": sale.inventory.price
        }
      } else {
        bookSalesHashMap[sale.inventory.book.title].quantity += sale.quantity
        bookSalesHashMap[sale.inventory.book.title].value += saleValue
      }
    }

    // NOW ADD KINDLE SALES
    const authorKindleSales = await prisma.kindleSale.findMany({
      where: {
        payments: {
          some: {
            userId: authorId
          },
        },
        datePay: {
          gte: startDate,
          lte: endDate
        }, 
        isDeleted: false
      }, 
      include: {
        payments: true,
        book: true
      },
      orderBy: {
        datePay: 'desc'
      }
    });

    for (const kindleSale of authorKindleSales) {
      totalSales += kindleSale.quantityEbook + kindleSale.quantityPod;
      totalValue += kindleSale.regalias
      sales.push({
        id: kindleSale.id,
        book_id: kindleSale.bookId,
        quantity: (kindleSale.quantityEbook + kindleSale.quantityPod),
        date: kindleSale.datePay,
        title: kindleSale.book.title,
        value: kindleSale.regalias
      })

      if (!bookSalesHashMap[kindleSale.book.title]) {
        bookSalesHashMap[kindleSale.book.title] = {
          "bookId": kindleSale.bookId,
          "title": kindleSale.book.title,
          "quantity": (kindleSale.quantityEbook + kindleSale.quantityPod),
          "value": kindleSale.regalias,
          // "price": 1
        }
      } else {
        bookSalesHashMap[kindleSale.book.title].quantity += (kindleSale.quantityEbook + kindleSale.quantityPod)
        bookSalesHashMap[kindleSale.book.title].value += kindleSale.regalias
      }
    }

    const bookSales = Object.values(bookSalesHashMap);

    res.status(200).json({
      totalSales,
      totalValue,
      bookSales,
      sales})
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
router.get('/sales', getAuthorSales)


export async function getMonthlySalesByPayments (req, res) {
  // Get the last twelfth month first day as a cutoff date
  const ltm = new Date();
  ltm.setMonth(ltm.getMonth()-12);
  ltm.setDate(1);

  const user = await prisma.user.findUnique({
    where: {
      id: req.session.user_id
    },
    include: {
      category: true
    }
  })

  try {
    // Get all existing payments and tied sales for that author
    const allAuthorPayments = await prisma.payment.findMany({
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
                    comissions: true,
                    deal_percentage: true
                  }
                },
                book: {
                  select: {
                    title: true
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

    let monthlySales = [];
    for (const payment of allAuthorPayments) {
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
    // console.log("monthlySales", monthlySales);
    // console.log("monthlySales.length", monthlySales.length);
    if (monthlySales.length < 13) {
      const now = new Date()
      let currentMonth = getForMonth(now);

      function decrementMonth() {
        let year = parseInt(currentMonth.substring(0,4))
        let month = parseInt(currentMonth.substring(5,7))
        
        if (month - 1 === 0) {
          const newYear = year - 1;
          const newMonth = 12;
          year = newYear;
          month = newMonth
        } else {
          const newMonth = month - 1;
          month = newMonth;
        }

        const nextCurrentMonth = year.toString() + '-' + month.toString().padStart(2, "0");
        currentMonth = nextCurrentMonth;
      }  

      for (let i = 0; i < 13; i++) {
        if (!monthlySales[i] || monthlySales[i].forMonth !== currentMonth) {
          monthlySales.splice(i, 0, {"forMonth": currentMonth, "sales": [], "costs": []});
          decrementMonth()
        } else {
          decrementMonth()
          continue;
        }
      }
    }

    res.status(200).json(monthlySales);
  } catch (error) {
    console.log('error fetching monthly sales by payments', error) 
    res.status(500).json({error: 'Internal server error'});
  }
}
router.get('/monthlySalesByPayments', getMonthlySalesByPayments);


export async function getAuthorBookInventories(req, res) {
  try {
    const bookId = parseInt(req.params.id);

    // Get all inventories for that specific book
    const bookInventories = await prisma.inventory.findMany({
      where: {
        bookId: bookId,
        isDeleted: false
      },
      select: {
        id: true,
        bookstoreId: true,
        bookstore: {
          select: {
            name: true,
            color: true
          }
        },
        book: {
          select: {
            title: true
          }
        },
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true
      }
    });

    // Group by bookstore
    let groupedByBookstore = {}
    // create the object if it doesn't exist, add things if it does
    for (const inventory of bookInventories) {
      if (inventory.bookstore.name in groupedByBookstore) {
        groupedByBookstore[inventory.bookstore.name].initial += inventory.initial;
        groupedByBookstore[inventory.bookstore.name].current += inventory.current;
        groupedByBookstore[inventory.bookstore.name].returns += inventory.returns;
        groupedByBookstore[inventory.bookstore.name].given += inventory.givenToAuthor;
      } else {
        groupedByBookstore[inventory.bookstore.name] = {
          bookstoreId: inventory.bookstoreId,
          name: inventory.bookstore.name,
          title: inventory.book.title,
          color: inventory.bookstore.color,
          initial: inventory.initial,
          current: inventory.current,
          returns: inventory.returns,
          given: inventory.givenToAuthor
        }
      }
    }

    res.status(200).json(Object.values(groupedByBookstore));
  } catch (error) {
    console.log("\n ERROR WHILE FETCHING THE BOOK INVENTORIES FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred while fetching relevant book inventories"});
  }
}
router.get("/bookInventories/:id", getAuthorBookInventories)

export async function getAuthorPayments (req, res) {
  try {
    // Getting our range ready by setting it 12m ago
    const ltm = new Date();
    ltm.setMonth(ltm.getMonth()-12);
    ltm.setDate(1);

    // Getting all payments from that date to now
    const allPayments = await prisma.payment.findMany({
      where: {
        isDeleted: false,
        userId: req.session.user_id,
        createdAt: {
          gt: ltm
        }
      },
      // select: {
      //   id: true,
      //   forMonth: true,
      //   status: true,
      // },
      include: {
        sales: true,
        kindleSales: true,
        costs: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const userWithCategory = await prisma.user.findUnique({
      where: {
        id: req.session.user_id
      },
      include: {
        category: true
      }
    })

    // Fill in empty months with 0s if necessary
    if (allPayments.length < 13) {
      // Get the YYYY-MM combination 12m ago
      const now = new Date();
      let currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Get an array of all the 12 monhts Y + M combination
      let ltmStrings = [];
      for (let i = 0; i < 12; i++) {
        let monthString = "";
        if ((currentMonth - i) <= 0) {
          let newCurrentMonth = currentMonth - i + 12;
          if (newCurrentMonth.toString().length === 1) {
            newCurrentMonth = "0" + newCurrentMonth.toString();
          } else {
            newCurrentMonth = newCurrentMonth.toString();
          }

          monthString = (currentYear - 1).toString() + '-' + newCurrentMonth;
        } else {
          let newCurrentMonth = (currentMonth-i).toString();
          if (newCurrentMonth.toString().length === 1) {
            newCurrentMonth = "0" + newCurrentMonth.toString();
          } else {
            newCurrentMonth = newCurrentMonth.toString();
          }

          monthString = currentYear.toString() + '-'+ newCurrentMonth;
        }
        ltmStrings.push(monthString);
      }

      // Compare with allPayments and fill in if missing
      for (let i = 0; i < ltmStrings.length; i++) {
        let existing = false;

        for (const payment of allPayments) {
          if (ltmStrings[i] === payment.forMonth) {
            existing = true;
          }
        }

        if (!existing) {
          allPayments.splice(i, 0, {
            forMonth: ltmStrings[i],
            status: "created",
            sales: [],
            kindleSales: [],
            costs: []
          });
        }
      };
    }

    //Calculate and add the total amount of each payment
    for (const payment of allPayments) {
      payment.amount = 0;
      // sales
      if (payment.sales.length > 0) {
        for (const sale of payment.sales) {
          const saleInventory = await prisma.inventory.findUnique({
            where:{
              id: sale.inventoryId
            },
            include: {
              bookstore: true
            }
          })

          payment.amount += calculateAuthorRevenue(
            saleInventory.bookstore.comissions,
            saleInventory.price,
            userWithCategory.category.management_min,
            saleInventory.bookstore.deal_percentage,
            sale.quantity
          )
        }
      }

      //kindleSales
      if (payment.kindleSales.length > 0) {
        for (const sale of payment.kindleSales) {
          if (!sale.isDeleted) {
            payment.amount += sale.regalias
          }
        }
      }

      //costs
      if (payment.costs.length > 0) {
        for (const cost of payment.costs) {
          payment.amount -= cost.amount
        }
      }
    }

    res.status(200).json(allPayments);
  } catch(error) {
    console.log("\n ERROR WHILE FETCHING PAYMENTS FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred while fetching relevant transfers"})
  }
}
router.get("/payments", getAuthorPayments);

export async function sendInvoice(req, res) {
  try {
    const userID = req.session.user_id;
    const user = await prisma.user.findUnique({
      where: {
        id: userID,
      }
    });
    const factura = req.files.factura[0];
    const constancia = req.files.constancia[0]
    const { month, monthOriginal, amount, uso, correo } = req.body;
    const name = user.first_name + " " + user.last_name;
    sendEmailWithInvoice(name, month, amount, uso, factura, constancia, correo);

    const updatedPayment = await prisma.payment.update({
      where: {
        userId_forMonth: {
          userId: userID,
          forMonth: monthOriginal
        }
      },
      data: {
        status: "solicited"
      }
    })
    res.status(200).json({message: "invoice sent successfully"})
  } catch (error) {
    console.log("\n ERROR WHILE SENDING INVOICE \n", error);
    res.status(500).json({error: "a server error occurred while sending the invoice"})
  }
}
router.post("/sendInvoice", upload.fields([
  { name: "factura", maxCount: 1},
  { name: "constancia", maxCount: 1}
]), sendInvoice)


export async function getCompleteInventory(req, res) {
  try {
    const allAuthorInventories = await prisma.inventory.findMany({
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
            isDeleted: true
          },
        },
        bookstore: {
          select: {
            id: true,
            name: true,
            color: true,
            isDeleted: true
          }
        },
        country: true,
        price: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          select: {
            quantity: true,
            isDeleted: true,
            payments: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    for (const inventory of allAuthorInventories) {
      inventory.sales = inventory.sales.filter(
        sale => sale.payments.some(payment => payment.userId === req.session.user_id)
      );
    }

    res.status(200).json(allAuthorInventories);
  } catch (error) {
    console.log("\n ERROR WHILE FETCHING PAYMENTS FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred while fetching the complete inventory status of the author"})
  }
}
router.get("/completeInventory", getCompleteInventory)


export default router;
