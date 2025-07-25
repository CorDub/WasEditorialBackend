import express from "express";
import bcrypt from 'bcrypt';
import { prisma } from "../prisma/client.js"
import multer from "multer";
import { sendEmailWithInvoice } from "../mailer.js";
import { calculateAuthorRevenue, getForMonth } from "../utils.js";

const upload = multer();
const router = express.Router();

router.patch('/change_password', async (req, res) => {
  try {
    const { user_id, password } = req.body;
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

    if (errors.length > 0) {
      res.status(400).json(errors);
      return;
    }

    const update = await prisma.user.update({
      where: {id: user_id},
      data: {password: await bcrypt.hash(password, 10)}
    });

    if (update) {
      res.status(200).json({message: "Successfully updated password"});
    } else {
      res.status(500).json({error: "There was an issue updating the password."});
    }

  } catch(error) {
    console.error("Error at the change_password route:", error);
  }
})

router.get('/books', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
        where: {
            users: {
                some: { id: req.session.user_id }
            },
            isDeleted: false
        }
    });

    res.status(200).json(books);
  } catch (error) {
      console.error(error);
    res.status(500).send("Server error");
  }
})


router.get('/inventories', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get all books with their inventory and sales data that belong to the user
    const books = await prisma.book.findMany({
      where: {
        users: {
          some: { id: req.session.user_id }
        },
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        users: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        inventories: {
          select: {
            sales: {
              select: {
                quantity: true,
                isDeleted: true
              }
            },
            country: true,
            initial: true,
            givenToAuthor: true,
            current: true,
            bookstoreId: true
          }
        }
      }
    });

    const allAuthorPayments = await prisma.payment.findMany({
      where: {
        userId: req.session.user_id
      },
      select: {
        sales: {
          select: {
            quantity: true,
            isDeleted: true,
            inventory: {
              select: {
                book: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    })

    let soldByBooks = [];
    for (const payment of allAuthorPayments) {
      for (const sale of payment.sales) {
        if (soldByBooks.length === 0) {
          if (sale.isDeleted === false) {
            soldByBooks.push({
              "id": sale.inventory.book.id,
              "title": sale.inventory.book.title,
              "sold": sale.quantity
            })
            continue;
          }
        }

        let existingBook = false;
        for (const book of soldByBooks) {
          if (book.title === sale.inventory.book.title) {
            if (sale.isDeleted === false) {
              book.sold += sale.quantity
              existingBook = true
            }
          }
        }
        
        if (!existingBook) {
          if (sale.isDeleted === false) {
            soldByBooks.push({
              "id": sale.inventory.book.id,
              'title': sale.inventory.book.title,
              'sold': sale.quantity
            })
          }
        }
      }
    }

    // Calculate overall totals across all books
    let overallInitialTotal = 0;
    let overallSoldTotal = 0;
    let overallInventoryInBookstores = 0;
    let overallInventoryInWas = 0;
    let overallInventoryInWasPerCountry = {};
    let overallEntregadosAlAutor = 0;

    // Calculate sales summary for each book
    const bookInventories = books.map(book => {
      // initial
      const initialTotal = book.inventories.reduce((sum, inv) => sum + inv.initial, 0);

      // sold
      let soldTotal = 0;
      // for (const inventory of book.inventories) {
      //   if (inventory.sales) {
      //     for (const sale of inventory.sales) {
      //       if (sale.isDeleted === false) {
      //         soldTotal += sale.quantity
      //       }
      //     }
      //   }
      // }
      // console.log("")
      // console.log("soldTotal", soldTotal)

      // let soldTotalPayments = 0;
      for (const bookSold of soldByBooks) {
        if (book.id === bookSold.id) {
          soldTotal = bookSold.sold
        }
      }
      // console.log("soldTotalPayments", soldTotalPayments)

      //givenToAuthor
      let entregadosAlAutor = 0;
      for (const inventory of book.inventories) {
        entregadosAlAutor += inventory.givenToAuthor
      };

      // remaining (disponibles)
      const remainingTotal = initialTotal - soldTotal - entregadosAlAutor;

      // bookstores
      let inventoryInBookstores = 0;

      // was + wasbyCountry
      let inventoryInWas = 0;
      let inventoryInWasPerCountry = {};
      for (const inventory of book.inventories) {
        // 3 = Plataforma Was Id
        if (inventory.bookstoreId === 3) {
          inventoryInWas = inventory.current
          // create key:value if doesn't exist, add if it does
          if (inventory.country in inventoryInWasPerCountry) {
            inventoryInWasPerCountry[inventory.country] += inventory.current
          } else {
            inventoryInWasPerCountry[inventory.country] = inventory.current
          }
        } else {
          inventoryInBookstores += inventory.current
        }
      }

      // Add to overall totals
      overallInitialTotal += initialTotal;
      overallSoldTotal += soldTotal;
      overallInventoryInBookstores += inventoryInBookstores;
      overallInventoryInWas += inventoryInWas;
      overallEntregadosAlAutor += entregadosAlAutor;
      // have to use a for loop for overallInventoryInWasPerCountry
      for (const [country, number] of Object.entries(inventoryInWasPerCountry)) {
        if (country in overallInventoryInWasPerCountry) {
          overallInventoryInWasPerCountry[country] += number;
        } else {
          overallInventoryInWasPerCountry[country] = number;
        }
      }

      return {
        bookId: book.id,
        title: book.title,
        author: book.author,
        summary: {
          initial: initialTotal,
          sold: soldTotal,
          total: remainingTotal,
          bookstores: inventoryInBookstores,
          was: inventoryInWas,
          wasPerCountry: inventoryInWasPerCountry,
          givenToAuthor: entregadosAlAutor
        }
      };
    });

    const overallRemainingTotal = overallInitialTotal - overallSoldTotal - overallEntregadosAlAutor;

    res.status(200).json({
      summary: {
        initial: overallInitialTotal,
        sold: overallSoldTotal,
        total: overallRemainingTotal,
        bookstores: overallInventoryInBookstores,
        was: overallInventoryInWas,
        wasPerCountry: overallInventoryInWasPerCountry,
        givenToAuthor: overallEntregadosAlAutor
      },
      bookInventories: bookInventories
    });
  } catch(error) {
    console.error("Error in the home route:", error);
    res.status(500).json({error: 'A server error occurred while fetching inventory data'});
  }
});


router.get('/books/:bookId/inventories', async (req, res) => {
  try {
    if (!req.session.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const book = await prisma.book.findFirst({
      where: {
        id: parseInt(req.params.bookId),
        users: {
          some: { id: req.session.user_id }
        },
        isDeleted: false
      }
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found or access denied" });
    }

    const inventories = await prisma.inventory.findMany({
      where: { bookId: parseInt(req.params.bookId) },
      include: {
        sales: true
      }
    });

    const initialTotal = inventories.reduce((sum, inv) => sum + inv.initial, 0);
    const soldTotal = inventories.reduce((sum, inv) => {
      const itemSales = inv.sales?.reduce((salesSum, sale) => salesSum + sale.quantity, 0) || 0;
      return sum + itemSales;
    }, 0);
    const remainingTotal = initialTotal - soldTotal;

    res.status(200).json({
      inventories,
      summary: {
        initial: initialTotal,
        sold: soldTotal,
        total: remainingTotal
      }
    });
  } catch(error) {
    console.error("Error in the get inventories route:", error);
    res.status(500).json({error: 'A server error occurred while fetching inventories'});
  }
});

router.get('/sales', async (req, res) => {
  try {
    const authorId = req.session.user_id;

    // Get date range from query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // let sales = await prisma.sale.findMany({
    //     where: {
    //       inventory: {
    //         book: {
    //           users: {
    //             some: {
    //               id: authorId
    //             }
    //           }
    //         }
    //       },
    //       createdAt: {
    //         gte: startDate,
    //         lte: endDate
    //       },
    //       isDeleted: false
    //     },
    //     include: {
    //       inventory: {
    //         include: {
    //           book: true,
    //           bookstore: true
    //         }
    //       },
    //       payments: true
    //     },
    //     orderBy: {
    //       createdAt: 'desc'
    //     }
    //   });
    
    let sales = await prisma.sale.findMany({
      where: {
        payments: {
          some: {
            userId: authorId
          }
        },
        createdAt: {
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
        createdAt: 'desc'
      }
    });

    // sales = sales.filter(sale => sale.payment.userId === authorId);

    let totalSales = 0;
    let totalValue = 0;
    let bookSalesHashMap = {};
    let numberOfAuthors = {};
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

    for (const sale of sales) {
      if (!numberOfAuthors[sale.inventory.book.title]) {
        const authorCount = await prisma.book.findUnique({
          where: {id: sale.inventory.book.id},
          select: {
            _count: {
              select: {users: true}
            }
          }
        });
        numberOfAuthors[sale.inventory.book.title] = authorCount._count.users;
      }

      const saleValue = calculateAuthorRevenue(
        sale.inventory.bookstore.comissions,
        sale.inventory.price,
        author.category.management_min,
        sale.inventory.bookstore.deal_percentage,
        sale.quantity,
      )

      totalSales += sale.quantity
      totalValue += saleValue

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

    const bookSales = Object.values(bookSalesHashMap);

    res.json({
      totalSales,
      totalValue,
      bookSales,
      sales: sales.map(sale => ({
        id: sale.id,
        book_id: sale.inventory.book.id,
        bookstore_id: sale.inventory.bookstore.id,
        quantity: sale.quantity,
        created_at: sale.createdAt,
        title: sale.inventory.book.title,
        bookstore_name: sale.inventory.bookstore.name,
        price: sale.inventory.price,
        value: calculateAuthorRevenue(
          sale.inventory.bookstore.comissions,
          sale.inventory.price,
          author.category.management_min,
          sale.inventory.bookstore.deal_percentage,
          sale.quantity,
        )
      }))
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/monthlySales', async (req, res) => {
  try {
    // Get the last twelfth month first day as a cutoff date
    const ltm = new Date();
    ltm.setMonth(ltm.getMonth()-12);
    ltm.setDate(1);

    // Get all sales for that user based on that;
    const data = await prisma.sale.findMany({
      where: {
        inventory: {
          book: {
            users: {
              some: {
                id: req.session.user_id
              }
            },
            isDeleted: false
          },
          bookstore: {
            isDeleted: false
          }
        },
        isDeleted: false,
        createdAt: {
          gt: ltm
        }
      },
      select: {
        id: true,
        quantity: true,
        createdAt: true,
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
                id: true,
                title: true,
              }
            },
            price: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const user = await prisma.user.findUnique({
      where: {
        id: req.session.user_id
      }
    });
    const userCategory = await prisma.category.findUnique({
      where: {
        id: user.categoryId
      }
    });

    // Preparing a 'scaffold' to reuse later, basically empty models
    let bookstores = await prisma.bookstore.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
      }
    });

    // Adding quantity to the scaffold
    for (const bookstore of bookstores) {
      bookstore["quantity"] = 0;
    }

    // Ensuring sales are grouped by month.
    let salesByMonths = {};
    let numberOfAuthors = {};
    for (const sale of data) {
      const date = new Date(sale.createdAt);
      const year = date.getFullYear();
      const month = (date.getMonth() +1).toString().padStart(2, "0");
      const key = `${year}-${month}`;
      if (!numberOfAuthors[sale.inventory.book.id]) {
        const authorCount = await prisma.book.findUnique({
          where: {id: sale.inventory.book.id},
          select: {
            _count: {
              select: {users: true}
            }
          }
        });
        numberOfAuthors[sale.inventory.book.id] = authorCount._count.users;
      }

      // console.log("")
      // console.log("sale.inventory.bookstore.comissions", sale.inventory.bookstore.comissions)
      // console.log("sale.inventory.price ", sale.inventory.price )
      // console.log("userCategory.management_min", userCategory.management_min)
      // console.log("sale.inventory.bookstore.deal_percentage", sale.inventory.bookstore.deal_percentage)
      // console.log("sale.quantity", sale.quantity)

      if (salesByMonths[key]) {
        salesByMonths[key]["sales"].push({...sale, 
          comissions: sale.inventory.bookstore.comissions
            ? userCategory.management_min
            : sale.inventory.price 
              * (sale.inventory.bookstore.deal_percentage / 100)
          //     * (userCategory.percentage_royalties / 100),
          // sharePerAuthor: (1/numberOfAuthors[sale.inventory.book.id] * 100).toFixed(2) + " %"
        });
        
        // console.log("comissions", salesByMonths[key]["sales"]);

        salesByMonths[key]["total"] += calculateAuthorRevenue(
          sale.inventory.bookstore.comissions,
          sale.inventory.price,
          userCategory.management_min,
          sale.inventory.bookstore.deal_percentage,
          sale.quantity,
        )
      } else {
        salesByMonths[key] = {
          sales: [{...sale, 
          comissions: sale.inventory.bookstore.comissions
            ? userCategory.management_min
            : sale.inventory.price 
              * (sale.inventory.bookstore.deal_percentage / 100)
              // * (userCategory.percentage_royalties / 100),
          // sharePerAuthor: (1/numberOfAuthors[sale.inventory.book.id] * 100).toFixed(2) + " %"
        }],
          ganancia: (
            sale.inventory.bookstore.comissions 
              ? (sale.inventory.price - userCategory.management_min)
                // / numberOfAuthors[sale.inventory.book.id]
              : sale.inventory.price
                * (sale.inventory.bookstore.deal_percentage / 100)
                // * (userCategory.percentage_royalties / 100)
                // / numberOfAuthors[sale.inventory.book.id]
          ),
          total: calculateAuthorRevenue(
              sale.inventory.bookstore.comissions,
              sale.inventory.price,
              userCategory.management_min,
              sale.inventory.bookstore.deal_percentage,
              sale.quantity,
            ),
          // deep cloning the bookstores to avoid having the same object being mutated later
          // and shared across different months instead of a different object every time
          transfers: bookstores.map(bookstore => ({...bookstore})),
          transfersTotal: 0
        }
      }
    }

    /// Adding transfers for the "entregado" column - same process
    // Get all the transfers from the last 12 months
    const allAuthorTransfers = await prisma.transfer.findMany({
      where: {
        isDeleted: false,
        fromInventory: {
          book: {
            users: {
              some: {
                id: req.session.user_id
              }
            }
          }
        },
        createdAt: {
          gte: ltm
        }
      },
      select: {
        id: true,
        quantity: true,
        createdAt: true,
        toInventory: {
          select: {
            bookstore: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Then add the transfer data to salesBymonth if the month of the transfer exist
    // Otherwise create it
    if (allAuthorTransfers.length > 0) {
      for (const transfer of allAuthorTransfers) {
        const transferMonth = getForMonth(transfer.createdAt);

        if (!salesByMonths[transferMonth]) {
          salesByMonths[transferMonth] = {
            sales: [],
            ganancia: 0,
            total: 0,
            // deep cloning the bookstores to avoid having the same object being mutated later
            // and shared across different months instead of a different object every time
            transfers: bookstores.map(bookstore => ({...bookstore})),
            transfersTotal: 0,
          }
        };

        for (const bookstore of salesByMonths[transferMonth]['transfers']) {
          // skip deliveries to author
          if (transfer.toInventory === null) {
            // bookstore.quantity += transfer.quantity;
            continue;
          }
          if (bookstore.id === transfer.toInventory.bookstore.id) {
            bookstore.quantity += transfer.quantity
          }
        }
        salesByMonths[transferMonth]["transfersTotal"] += transfer.quantity
      }
    }

    // Fill in the missing months with phantom data (0s) so that it will display
    // correctly with the month chosen (based on index)

    let salesByMonthsList = Object.entries(salesByMonths);
    let newSalesByMonthsList = [];
    // Get the YYYY-MM combination 12m ago
    const now = new Date();
    let currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get an array of all the 12 monhts Y + M combination
    let ltmStrings = [];
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      ltmStrings.push(monthStr);
    }

    for (let i = 0; i < ltmStrings.length; i++) {
      let existing = false;

      for (const month of salesByMonthsList) {
        if (ltmStrings[i] === month[0]) {
          newSalesByMonthsList.push(month);
          existing = true;
          continue;
        }
      }

      if (!existing) {
        newSalesByMonthsList.push([
          ltmStrings[i], {
            ganancia: 0,
            sales: [],
            total: 0,
            transfers: [],
            transfersTotal: 0
          }
        ])
      }
    }

    res.status(200).json(newSalesByMonthsList);
  } catch (error) {
    console.error("error fetching monthly sales", error);
    res.status(500).json({error: 'Internal server error'});
  }
})

router.get('/monthlySalesByPayments', async (req, res) => {
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
        "costs": []
      }

      for (const sale of payment.sales) {
        if (sale.isDeleted === true) {
          continue;
        }
        
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

        let existingBook = false;
        for (const entry of paymentSales.sales) {
          if (entry.title === sale.inventory.book.title) {

            let existingBookstore = false;
            for (const bookstore of entry.bookstores) {
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
})

router.get('/currentTienda', async (req, res) => {
  try {
    const month = req.query.month;

    let monthDateTime;
    if (parseInt(month.substring(5,7)) === 12) {
      monthDateTime = new Date(`${parseInt(month.substring(0,4))+1}-01-01`)
    } else {
      const nextMonth = parseInt(month.substring(5,7)) + 1
      monthDateTime = new Date(`${month.substring(0,4)}-${nextMonth}-01`);
    }

    const inventories = await prisma.inventory.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          lt: monthDateTime
        },
        book: {
          users: {
            some: {
              id: req.session.user_id
            }
          }
        }
      },
      include: {
        bookstore: {
          select: {
            id: true,
            name: true
          },
        },
        sales: {
          where: {
            isDeleted: false
          }
        },
        transfersFrom: {
          where: {
            isDeleted : false
          }
        },
        transfersTo: {
          where: {
            isDeleted : false
          }
        },
      }
    });

    let inventoriesReconstructed = [];
    for (const inventory of inventories) {
      let existing = false;

      for (const obj of inventoriesReconstructed) {
        if (obj.id === inventory.bookstore.id) {
          obj.total += inventory.initial,
          obj.current += inventory.current

          for (const transfer of inventory.transfersFrom) {
            if (transfer.createdAt >= monthDateTime) {
              obj.current += transfer.quantity
              obj.initial += transfer.quantity
            }
          };

          for (const sale of inventory.sales) {
            if (sale.createdAt >= monthDateTime) {
              obj.current += sale.quantity
            }
          };

          for (const transfer of inventory.transfersTo) {
            if (transfer.createdAt > monthDateTime) {
              obj.current -= transfer.quantity
              obj.initial -= transfer.quantity
            }
          }

          existing = true;
          break;
        }
      }

      if (!existing) {
        let tbp = {
          name: inventory.bookstore.name,
          total: inventory.initial,
          current: inventory.current
        };

        // initial should be more appropriately renamed to total
        for (const transfer of inventory.transfersFrom) {
          if (transfer.createdAt >= monthDateTime) {
            tbp.current += transfer.quantity
            tbp.initial += transfer.quantity
          }
        };

        for (const sale of inventory.sales) {
          if (sale.createdAt >= monthDateTime) {
            tbp.current += sale.quantity
          }
        };

        for (const transfer of inventory.transfersTo) {
          if (transfer.createdAt >= monthDateTime) {
            tbp.current -= transfer.quantity
            tbp.initial -= transfer.quantity
          }
        };

        inventoriesReconstructed.push(tbp);
      }
    }

    let groupedTiendaData = inventoriesReconstructed.reduce((groupedByTienda, {name, total, current}) => {
      if (!groupedByTienda[name]) {
        groupedByTienda[name] = { name, total: 0, current: 0};
      }
      groupedByTienda[name].total += total;
      groupedByTienda[name].current += current;
      return groupedByTienda;
    }, {});

    const groupedTiendaDataList = Object.values(groupedTiendaData);

    res.status(200).json(groupedTiendaDataList);
  } catch (error) {
    console.log("\n ERROR PROVIDING RELEVANT INVENTORIES \n",error);
    res.status(500).json({error: "There was a server error fetching the relevant data"});
  };
})

router.get('/givenToAuthorTransfers', async (req, res) => {
  const currentUserId = req.session.user_id;
  try {
    const relevantTransfers = await prisma.transfer.findMany({
      where: {
        isDeleted: false,
        type: 'send',
        toInventoryId: null,
        fromInventory: {
          book: {
            users: {
              some: {
                id: currentUserId
              }
            }
          }
        }
      },
      select: {
        id: true,
        quantity: true,
        note: true,
        deliveryDate: true,
        place: true,
        person: true,
        fromInventory: {
          select: {
            book: {
              select: {
                title: true,
                id: true
              }
            }
          }
        }
      },

    })

    res.status(200).json(relevantTransfers);
  } catch (error) {
    console.log("\n ERROR FETCHING RELEVENT TRANSFERS FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred while fetching relevant transfers"});
  }
})

router.get('/bookstoreInventories/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    // fetch all inventories from the author

    let relevantInventories;
    if (bookId) {
      relevantInventories = await prisma.inventory.findMany({
        where: {
          isDeleted: false,
          bookId: bookId
        },
        select: {
          id: true,
          book: {
            select: {
              title: true
            }
          },
          bookId: true,
          bookstore: {
            select: {
              name: true,
              color: true
            }
          },
          bookstoreId: true,
          current: true
        }
      });
    } else {
      relevantInventories = await prisma.inventory.findMany({
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
          id: true,
          book: {
            select: {
              title: true
            }
          },
          bookId: true,
          bookstore: {
            select: {
              name: true,
              color: true
            }
          },
          bookstoreId: true,
          current: true
        }
      });
    }

    // group the results by bookstore and books
    let relevantInventoriesByBookstore = {};
    let relevantInventoriesByBook = {};

    for (const inventory of relevantInventories) {
      // grouping by bookstores
      if (relevantInventoriesByBookstore.hasOwnProperty(inventory.bookstoreId)) {
        relevantInventoriesByBookstore[inventory.bookstoreId].current += inventory.current
      } else {
        /// 3 = BookstoreId of Plataforma Was that we'll be excluding here.
        if (inventory.bookstoreId !== 3) {
          relevantInventoriesByBookstore[inventory.bookstoreId] = {
            name: inventory.bookstore.name,
            current: inventory.current,
            color: inventory.bookstore.color,
            title: inventory.book.title
          }
        }
      };

      // grouping by book and populating summary
      if (relevantInventoriesByBook.hasOwnProperty(inventory.bookId)) {
        relevantInventoriesByBook[inventory.bookId].summary += inventory.current;
        if (relevantInventoriesByBook[inventory.bookId].hasOwnProperty(inventory.bookstoreId)) {
          relevantInventoriesByBook[inventory.bookId][inventory.bookstoreId].current += inventory.current
        } else {
          relevantInventoriesByBook[inventory.bookId][inventory.bookstoreId] = {
            bookstoreName: inventory.bookstore.name,
            current: inventory.current,
            color: inventory.bookstore.color
          }
        }
      } else {
        relevantInventoriesByBook[inventory.bookId] = {
          title: inventory.book.title,
          [inventory.bookstoreId] : {
            bookstoreName : inventory.bookstore.name,
            current: inventory.current
          },
          summary: inventory.current,
          color: inventory.bookstore.color
        }
      }
    }

    res.status(200).json({
      "inventoriesByBookstores" : relevantInventoriesByBookstore,
      "inventoriesByBook": relevantInventoriesByBook
    });
  } catch (error) {
    console.log("\n ERROR FETCHING RELEVANT INVENTORIES FROM SERVER \n", error);
    res.status(500).json({error: "a server error occured while fetching relevant inventories"});
  }
})

router.get("/wasInventories", async (req, res) => {
  try {
    // fetch all was inventories from the author
    const relevantInventories = await prisma.inventory.findMany({
      where: {
        isDeleted: false,
        book: {
          users: {
            some: {
              id: req.session.user_id
            }
          }
        },
        bookstoreId: 3
      },
      select: {
        id: true,
        book: {
          select: {
            title: true
          }
        },
        bookId: true,
        bookstore: {
          select: {
            name: true,
          }
        },
        bookstoreId: true,
        current: true
      }
    });

    let relevantInventoriesByBook = {};

    for (const inventory of relevantInventories) {
      if (relevantInventoriesByBook.hasOwnProperty(inventory.bookId)) {
        relevantInventoriesByBook[inventory.bookId].current += inventory.current
      } else {
        relevantInventoriesByBook[inventory.bookId] = {
          title: inventory.book.title,
          current: inventory.current
        }
      }
    }

    res.status(200).json(relevantInventoriesByBook);
  } catch (error) {
    console.log('\n ERROR WHILE FETCHING THE WAS INVENTORIES FROM SERVER \n', error);
    res.status(500).json({error: "a server error occured while fetching relevant inventories"});
  }
})

router.get("/bookInventories/:id", async (req, res) => {
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
})

router.get("/payments", async (req, res) => {
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
            costs: []
          });
        }
      };
    }

    //Calculate and add the total amount of each payment
    for (const payment of allPayments) {
      payment.amount = 0;
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
})

router.post("/sendInvoice", upload.fields([
  { name: "factura", maxCount: 1},
  { name: "constancia", maxCount: 1}
]), async (req, res) => {
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
})

router.get("/completeInventory", async (req, res) => {
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
})

router.get("/costs/:id", async (req, res) => {
  const paymentIdQuery = parseInt(req.params.id);
  try {
    const fetchedCosts = await prisma.cost.findMany({
      where: {
        paymentId: paymentIdQuery,
        isDeleted: false,
        payment: {
          userId: req.session.user_id
        }
      },
      select: {
        id: true,
        note: true,
        amount: true
      }
    });

    if (fetchedCosts) {
      res.status(200).json(fetchedCosts);
    }
  } catch(error) {
    console.log("\n ERROR WHILE FETCHING COSTS FROM THE SERVER \n", error);
    res.status(500).json({error: "a server error occurred while fetching costs."})
  }
})

export default router;
