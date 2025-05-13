import express from "express";
import bcrypt from 'bcrypt';
import { prisma } from "./../server.js"
import { truncateSync } from "fs";

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
    // if (!req.session.user_id) {
    //     return res.status(401).json({ message: "Unauthorized" });
    // }
    console.log(req.session.user_id)
    const books = await prisma.book.findMany({
        where: {
            users: {
                some: { id: req.session.user_id }
            }
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
      include: {
        inventories: {
          include: {
            sales: true
          }
        }
      }
    });

    // Calculate overall totals across all books
    let overallInitialTotal = 0;
    let overallSoldTotal = 0;
    let overallInventoryInBookstores = 0;
    let overallInventoryInWas = 0;
    let overallEntregadosAlAutor = 0;

    // Calculate sales summary for each book
    const bookInventories = books.map(book => {
      const initialTotal = book.inventories.reduce((sum, inv) => sum + inv.initial, 0);
      let soldTotal = 0;
      for (const inventory of book.inventories) {
        if (inventory.sales) {
          for (const sale of inventory.sales) {
            soldTotal += sale.quantity
          }
        }
      }
      let entregadosAlAutor = 0;
      for (const inventory of book.inventories) {
        entregadosAlAutor += inventory.givenToAuthor
      };
      const remainingTotal = initialTotal - soldTotal - entregadosAlAutor;
      let inventoryInBookstores = 0;
      let inventoryInWas = 0;
      for (const inventory of book.inventories) {
        if (inventory.bookstoreId === 3) {
          inventoryInWas = inventory.current
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
        }
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

    console.log(`Found ${inventories.length} inventory records for bookId ${req.params.bookId}`);

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

    const sales = await prisma.sale.findMany({
        where: {
          inventory: {
            book: {
              users: {
                some: {
                  id: authorId
                }
              }
            }
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          inventory: {
            include: {
              book: true,
              bookstore: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

    const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalValue = sales.reduce((sum, sale) => {
      const price = sale.inventory.book.price || 199.99;
      return sum + (price * sale.quantity);
    }, 0);

    const bookSales = sales.reduce((acc, sale) => {
      const existingBook = acc.find(b => b.bookId === sale.inventory.book.id);
      const price = sale.inventory.book.price || 199.99;
      const saleValue = price * sale.quantity;

      if (existingBook) {
        existingBook.quantity += sale.quantity;
        existingBook.value += saleValue;
      } else {
        acc.push({
          bookId: sale.inventory.book.id,
          title: sale.inventory.book.title,
          quantity: sale.quantity,
          value: saleValue,
          price: price
        });
      }
      return acc;
    }, []);

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
        price: sale.inventory.book.price || 199.99,
        value: (sale.inventory.book.price || 199.99) * sale.quantity
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

    // console.log("LTM", ltm);

    // Get all sales for that user based on that;
    const data = await prisma.sale.findMany({
      where: {
        inventory: {
          book: {
            users: {
              some: {
                id: req.session.user_id
              }
            }
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
                name: true
              }
            },
            book: {
              select: {
                title: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Need this for the category of the author,
    // which is used in how much author make from the sales
    const user = await prisma.user.findUnique({
      where: {
        id: req.session.user_id
      }
    });

    // Now getting the category
    const userCategory = await prisma.category.findUnique({
      where: {
        id: user.categoryId
      }
    });

    // Preparing a 'scaffold' to reuse later, basically empty models
    let bookstores = await prisma.bookstore.findMany({
      select: {
        id: true,
        name: true
      }
    });

    // Adding quantity to the scaffold
    for (const bookstore of bookstores) {
      bookstore["quantity"] = 0;
    }

    // Ensuring sales are grouped by month.
    // If the month already exist within salesByMonths we add the numbers of the current sale
    // If not, we create the month with the data of the current sale and the previous scaffold for bookstores
    let salesByMonths = {};
    for (const sale of data) {
      if (salesByMonths[sale.createdAt.toISOString().substring(0,7)]) {
        salesByMonths[sale.createdAt.toISOString().substring(0,7)]["sales"].push(sale);
        salesByMonths[sale.createdAt.toISOString().substring(0,7)]["total"] += (
          (sale.inventory.book.price * sale.quantity)
          * (userCategory.percentage_management_stores / 100)
          * (userCategory.percentage_royalties / 100)
        )
      } else {
        salesByMonths[sale.createdAt.toISOString().substring(0,7)] = {
          sales: [sale],
          ganancia: (
            sale.inventory.book.price
            * (userCategory.percentage_management_stores / 100)
            * (userCategory.percentage_royalties / 100)
          ),
          total: (
            (sale.inventory.book.price * sale.quantity)
            * (userCategory.percentage_management_stores / 100)
            * (userCategory.percentage_royalties / 100)
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
        const transferMonth = transfer.createdAt.toISOString().substring(0,7);

        if (!salesByMonths[transferMonth]) {
          salesByMonths[transferMonth] = {
            sales: [],
            ganancia: 0,
            total: 0,
            // deep cloning the bookstores to avoid having the same object being mutated later
            // and shared across different months instead of a different object every time
            transfers: bookstores.map(bookstore => ({...bookstore})),
            transfersTotal: 0
          }
        };

        for (const bookstore of salesByMonths[transferMonth]['transfers']) {
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
    if (Object.keys(salesByMonths).length < 12) {
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

      // Compare with salesByMonths and fill in if missing
      for (let i = 0; i < ltmStrings.length; i++) {
        let existing = false;

        for (const month of salesByMonthsList) {
          if (ltmStrings[i] === month[0]) {
            existing = true;
          }
        }

        if (!existing) {
          salesByMonthsList.splice(i, 0, [ltmStrings[i], {
            ganancia: 0,
            sales: [],
            total: 0,
            transfers: [],
            transfersTotal: 0
          }]);
        }
      };
    }
    res.status(200).json(salesByMonthsList);
  } catch (error) {
    console.error("error fetching monthly sales", error);
    res.status(500).json({error: 'Internal server error'});
  }
})

router.get('/currentTienda', async (req, res) => {
  try {
    const month = req.query.month;
    // let nextMonth;
    // if (parseInt(month.substring(5,7)) === 12) {
    //   nextMonth = 1
    // } else {
    //   nextMonth = parseInt(month.substring(5,7)) + 1
    // }
    // const monthDateTime = new Date(`${month.substring(0,4)}-${nextMonth}-01`);

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
      // select: {
      //   bookstore: {
      //     select: {
      //       id: true,
      //       name: true
      //     }
      //   }
      // }
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
      // if (inventory.id !== inventories[0].id) {
      //   continue;
      // }
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

    res.status(200).json(inventoriesReconstructed);
  } catch (error) {
    console.log("\n ERROR PROVIDING RELEVANT INVENTORIES \n",error);
    res.status(500).json({error: "There was a server error fetching the relevant data"});
  };
})

router.get('/givenToAuthorTransfers', async (req, res) => {
  const currentUserId = req.session.user_id
  console.log("\n currentUserId \n", currentUserId);
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

router.get('/bookstoreInventories', async (req, res) => {
  try {
    const bookId = parseInt(req.query.bookId);
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
            color: inventory.bookstore.color
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

    console.log("\n RELEVANT INVENTORIES \n", relevantInventories);

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

router.get("/bookInventories", async (req, res) => {
  try {
    const bookId = parseInt(req.query.bookId);

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
      }
    });

    // Fill in empty months with 0s if necessary
    if (allPayments.length < 12) {
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
            amount: 0,
            forMonth: ltmStrings[i],
            isPaid: false
          });
        }
      };
    }

    res.status(200).json(allPayments);
  } catch(error) {
    console.log("\n ERROR WHILE FETCHING PAYMENTS FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred while fetching relevant transfers"})
  }
})

export default router;
