import express from "express";
import bcrypt from 'bcrypt';
import { prisma } from "./../server.js"

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
      const remainingTotal = initialTotal - soldTotal;
      let inventoryInBookstores = 0;
      let inventoryInWas = 0;
      for (const inventory of book.inventories) {
        if (inventory.bookstoreId === 3) {
          inventoryInWas = inventory.current
        } else {
          inventoryInBookstores += inventory.current
        }
      }
      let entregadosAlAutor = 0;
      for (const inventory of book.inventories) {
        entregadosAlAutor += inventory.givenToAuthor
      };


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

    const overallRemainingTotal = overallInitialTotal - overallSoldTotal;

    console.log(`Processed sales data for ${books.length} books for user ${req.session.user_id}`);

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

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

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

export default router;
