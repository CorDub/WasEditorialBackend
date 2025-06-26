import { Role } from "@prisma/client";
import express from "express";
import bcrypt from 'bcrypt';
import { sendSetPasswordMail } from './../mailer.js';
import { createRandomPassword } from './../utils.js';
import { prisma } from "./../server.js"

const router = express.Router();

// User routes

router.get('/users', async (req, res) => {
  try {
    // const cachedData = await redisClient.get("authorsList");

    // if (cachedData) {
    //   console.log(cachedData);
    //   return res.json(JSON.parse(cachedData));
    // }

    const users = await prisma.user.findMany({
      where: {
        role: Role.author,
        isDeleted: false,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        country: true,
        referido: true,
        email: true,
        phone: true,
        clabe: true,
        name_bank_account: true,
        bank: true,
        swift: true,
        category: {
          where: {
            isDeleted: false
          },
          select: {
            type: true
          }
        }
      },
      orderBy: [
        {first_name: 'asc'},
        {last_name: 'asc'}
      ]
    });

    // await redisClient.set("authorsList", JSON.stringify(users));

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at users route"});
  }
});

router.post('/user', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      country,
      referido,
      email,
      category } = req.body;

    const existing = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    const password = createRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      if (existing.isDeleted === false) {
        res.status(500).json({message: "Este usuario ya existe"})
        return;
      }

      const exhumedUser = await prisma.user.update({
        where: {id: existing.id},
        data: {
          first_name: firstName,
          last_name: lastName,
          country: country,
          referido: referido,
          email: email,
          password: hashedPassword,
          categoryId: parseInt(category),
          isDeleted: false
        }
      });
      res.status(201).json({
        firstName: exhumedUser.first_name,
        lastName: exhumedUser.last_name,
        email: exhumedUser.email});
      sendSetPasswordMail(email, firstName, password);
      return;
    }

    const new_author =  await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        country: country,
        referido: referido,
        email: email,
        password: hashedPassword,
        categoryId: parseInt(category)
      },
    });

    res.status(201).json({
      firstName: new_author.first_name,
      lastName: new_author.last_name,
      email: new_author.email});
    sendSetPasswordMail(email, firstName, password);
  } catch(error) {
    console.error(error);
    if (String(error).includes(("Unique constraint failed on the fields: (`email`)"))) {
      res.status(500).json({message: "El correo ya está usado"})
      return;
    }

    if (String(error).includes(("Unique constraint failed on the fields: (`first_name`,`last_name`)"))) {
      res.status(500).json({message: "Un autor con el mismo nombre completo ya existe"})
      return;
    }
    res.status(500).json({ error: error });
  }
});

router.patch('/user', async (req, res) => {
  try {
    const {
      id,
      first_name,
      last_name,
      country,
      referido,
      email,
      categoryId } = req.body;
    const updatedAuthor = await prisma.user.update({
      where: {id: parseInt(id)},
      data: {
        first_name: first_name,
        last_name: last_name,
        country: country,
        referido: referido,
        email: email,
        category: {
          connect: {
            id: parseInt(categoryId)
          }
        }
      }
    });

    if (updatedAuthor) {
      res.status(200).json({message: "Successfully updated user"});
    } else {
      res.status(500).json({error: "There was an issue updating the author"});
    };

  } catch(error) {
    console.error("Server error at the update user route:", error);
  }
})

router.delete('/user/:id', async (req, res) => {
  const user_id = parseInt(req.params.id);

  try {
    const deletedAuthor = await prisma.user.update({
      where: {id: user_id},
      data: {isDeleted: true}
    });

    if (deletedAuthor) {
      const deletedBooksIds = await softDeleteBooksOnCascade(deletedAuthor);
      const deletedInventoriesIds = await softDeleteInventoriesOnCascade(deletedBooksIds, "books");
      await softDeleteSalesOnCascade(deletedInventoriesIds);
      const deletedPayments = await softDeletePaymentsOnCascade(deletedAuthor);
      for (const payment of deletedPayments) {
        await softDeleteCostsOnCascade(payment);
      }
    };

    res.status(200).json({message: "El autor ha sido eliminado (recuperable) con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the user'});
  }
})

//Categories routes

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({where: {isDeleted: false}});
    res.status(200).json(categories);
  } catch(error) {
    console.error("Error in the get categories route:", error);
    res.status(500).json({error: 'A server error occurred while fetching categories'});
  }
})

router.get('/categories-type', async (req, res) => {
  try {
    const categories_type = await prisma.category.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        type: true
      }
    });
    res.status(200).json(categories_type);
  } catch(error) {
    console.error("Error in the get categories-type route:", error);
    res.status(500).json({error: "A server error occurred while fetching categories-type"});
  }
})

router.delete('/category/:id', async (req, res) => {
  const category_id = parseInt(req.params.id);

  try {
    const deletedCategory = await prisma.category.update({where:
      {id: category_id},
      data: { isDeleted: true }
    });

    if (deletedCategory) {
      const authorsToUpdate = await prisma.user.findMany({
        where: {
          isDeleted: false,
          categoryId: category_id,
        }
      });

      await Promise.all(
        authorsToUpdate.map(async (author) => {
          await prisma.user.update({
            where: {id: author.id},
            data: {categoryId: null}
          })
        })
      );
    };

    res.status(200).json({message: "La categoria ha sido eliminada con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the category'});
  }
})

router.post('/category', async (req, res) => {
  try {
    const {
      tipo,
      regalias,
      gestionTiendas,
      gestionMinima } = req.body;

    const existing = await prisma.category.findUnique({
      where: {
        type: tipo
      }
    });

    if (existing) {
      if (existing.isDeleted === false) {
        res.status(500).json({message: "Esta categoria ya existe"})
        return;
      }

      const exhumedUser = await prisma.user.update({
        where: {id: existing.id},
        data: {
          type: tipo,
          percentage_royalties: parseFloat(regalias),
          percentage_management_stores: parseFloat(gestionTiendas),
          management_min: parseFloat(gestionMinima),
          isDeleted: false
        }
      });
      res.status(201).json({name: exhumedUser.type});
      return;
    }

    const new_category =  await prisma.category.create({
      data: {
        type: tipo,
        percentage_royalties: parseFloat(regalias),
        percentage_management_stores: parseFloat(gestionTiendas),
        management_min: parseFloat(gestionMinima),
      },
    });

    res.status(201).json({name: new_category.type});
  } catch(error) {
    if (String(error).includes(("Unique constraint failed on the fields: (`type`)"))) {
      res.status(500).json({message: "Uniqueness error - tipo"})
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the category'});
  }
});

router.patch('/category', async (req, res) => {
  try {
    const {
      id,
      tipo,
      regalias,
      gestionTiendas,
      gestionMinima } = req.body;
    const previousCategory = await prisma.category.findUnique({
      where: {id: id}
    });
    const updatedCategory = await prisma.category.update({
      where: {id: id},
      data: {
        type: tipo,
        percentage_royalties: parseInt(regalias),
        percentage_management_stores: parseInt(gestionTiendas),
        management_min: parseInt(gestionMinima),
      }
    });

    updatePaymentsOnCascade(updatedCategory, previousCategory);

    if (updatedCategory) {
      res.status(200).json({message: "Successfully updated category"});
    } else {
      res.status(500).json({error: "There was an issue updating the category"});
    };

  } catch(error) {
    if (String(error).includes(("Unique constraint failed on the fields: (`type`)"))) {
      res.status(500).json({message: "Uniqueness error - tipo"})
      return;
    }

    console.error("Server error at the update category route:", error);
  }
});

// Books routes

router.get('/book', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: {
        isDeleted: false
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          }
        }
      },
      orderBy: {
        title: "asc"
      }
    });

    books.map((book) => {
      book.authorNames = "";
      book.users.map((user) => {
        if (book.authorNames === "") {
          book.authorNames = ((user.first_name + " " + user.last_name))
        } else {
          book.authorNames += (", " + ((user.first_name + " " + user.last_name)))
        }
      })
    })

    res.status(200).json(books);
  } catch(error) {
    console.error("Error in the get books route:", error);
    res.status(500).json({error: 'A server error occurred while fetching books'});
  }
})

router.get('/existingBooks', async (req, res) => {
  try {
    const existingBooks = await prisma.book.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        title: true
      },
      orderBy: {
        title: "asc"
      }
    });
    res.status(200).json(existingBooks);
  } catch (error) {
    console.error("Error while fetching existingBooks in the backend:", error);
    res.status(500).json({error: "A server error occurred while fetching existingBooks"});
  }
})

router.post('/book', async (req, res) => {
  try {
    const {
      title,
      pasta,
      price,
      isbn,
      quantity,
      authors } = req.body;

    const authorsIds = []
    authors.map((authorId) => {
      authorsIds.push({"id": authorId});
    })

    const new_book = await prisma.book.create({
      data: {
        title: title,
        pasta: pasta,
        isbn: isbn,
        users: {
          connect: authorsIds,
        },
      }
    });

    let new_impression;
    if (new_book) {
      new_impression = await prisma.impression.create({
        data: {
          bookId: new_book.id,
          quantity: quantity,
        }
      })
    };

    let new_inventory;
    if (new_impression) {
      new_inventory = await prisma.inventory.create({
        data: {
          bookId: new_book.id,
          bookstoreId: 3,
          country: "México",
          price: parseFloat(price),
          initial: quantity,
          current: quantity
        }
      })
    }

    res.status(201).json({title: new_book.title});
  } catch(error) {
    if (String(error).includes(("Unique constraint failed on the fields: (`isbn`)"))) {
      res.status(500).json({message: "Este ISBN ya existe"})
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the book'});
  }
});

router.delete('/book/:id', async (req, res) => {
  const book_id = parseInt(req.params.id);

  try {
    const deletedBook = await prisma.book.update({where:
      {id: book_id},
      data: {
        isDeleted: true
      }
    });

    if (deletedBook) {
      const deletedInventoriesIds = await softDeleteInventoriesOnCascade([book_id], "books");
      await softDeleteSalesOnCascade(deletedInventoriesIds);
      await softDeleteImpressionsOnCascade(deletedBook);
    }

    res.status(200).json({message: "El libro ha sido eliminado con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the book'});
  }
})

router.patch('/book', async (req, res) => {
  try {
    const {
      id,
      title,
      pasta,
      isbn,
      authors } = req.body;

    const authorsIds = []
    authors.map((author) => {
      authorsIds.push({"id": author.id});
    })

    console.log("authorsIds", authorsIds);

    const previousBook = await prisma.book.findUnique({
      where: {id: id},
      select: {
        users: {
          select: {
            id: true
          }
        }
      }
    });

    let previousNumberOfAuthors = 0
    if (previousBook) {
      previousNumberOfAuthors = previousBook.users.length;
    }

    const updatedBook = await prisma.book.update({
      where: {id: id},
      data: {
        title: title,
        pasta: pasta,
        isbn: isbn,
        users: {
          connect: authorsIds,
        }
      }
    });

    if (previousNumberOfAuthors !== authorsIds.length) {
      const impactedInventories = await prisma.inventory.findMany({
        where: {
          bookId: id,
          isDeleted: false
        },
        select: {
          sales: {
            select: {
              id: true,
              createdAt: true,
              quantity: true
            }
          },
          bookstore: {
            select: {
              comissions: true
            }
          },
          price: true
        }
      });

      for (const inventory of impactedInventories) {
        for (const sale of inventory.sales) {
          const date = new Date(sale.createdAt);
          const year = String(date.getFullYear());
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const saleForMonth = year + "-" + month

          for (const authorId of authorsIds) {
            const author = await prisma.user.findUnique({
              where: {
                id: authorId.id
              },
              select: {
                category: {
                  select: {
                    percentage_management_stores: true,
                    percentage_royalties: true,
                    management_min: true
                  }
                },
                first_name: true
              }
            });

            const previousPayment = await prisma.payment.findUnique({
              where: {
                userId_forMonth: {
                  userId: authorId.id,
                  forMonth: saleForMonth
                }
              }
            });

            if (previousPayment && previousPayment.status !== "paid") {
              const previousSaleValue = calculateAuthorRevenue(
                inventory.bookstore.comissions,
                inventory.price,
                author.category.management_min,
                author.category.percentage_management_stores,
                author.category.percentage_royalties,
                sale.quantity,
                previousNumberOfAuthors
              );

              const newSaleValue = calculateAuthorRevenue(
                inventory.bookstore.comissions,
                inventory.price,
                author.category.management_min,
                author.category.percentage_management_stores,
                author.category.percentage_royalties,
                sale.quantity,
                authorsIds.length
              );

              console.log("")
              console.log("author.first_name", author.first_name)
              console.log("previousPayment.amount", previousPayment.amount)
              console.log("previousSaleValue", previousSaleValue)
              console.log("newSaleValue", newSaleValue)

              const updatedPayment = await prisma.payment.update({
                where: {
                  id: previousPayment.id
                },
                data: {
                  amount: previousPayment.amount - previousSaleValue + newSaleValue
                }
              })
            }
          }
        }
      }
    }

    if (updatedBook) {
      res.status(200).json({message: "Successfully updated book"});
    } else {
      res.status(500).json({error: "There was an issue updating the book"});
    };

  } catch(error) {
    console.error("Server error at the update book route:", error);
    res.status(500).json({error: "There was an issue updating the book"});
  }
});

// Bookstores routes

router.get('/bookstore', async (req, res) => {
  try {
    const bookstores = await prisma.bookstore.findMany({where: {isDeleted: false}});
    res.status(200).json(bookstores);
  } catch(error) {
    console.error("Error in the get bookstores route:", error);
    res.status(500).json({error: 'A server error occurred while fetching bookstores'});
  }
})

router.get('/existingBookstores', async (req, res) => {
  try {
    const existingBookstores = await prisma.bookstore.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true
      }
    })
    res.status(200).json(existingBookstores);
  } catch (error) {
    console.error("Error in the route existingBookstores:", error);
    res.status(500).json({error: 'A server error occurred while fetching existingBookstores'});
  }
})

router.post('/bookstore', async (req, res) => {
  try {
    const {
      name,
      dealPercentage,
      comissions,
      contactName,
      contactPhone,
      contactEmail } = req.body;
    const new_bookstore =  await prisma.bookstore.create({
      data: {
        name: name,
        deal_percentage: parseFloat(dealPercentage),
        comissions: comissions === "true" ? true : false,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
      },
    });

    res.status(201).json({name: new_bookstore.name});
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the category'});
  }
})

router.patch('/bookstore', async (req, res) => {
  try {
    const {
      id,
      name,
      dealPercentage,
      comissions,
      contactName,
      contactPhone,
      contactEmail } = req.body;

    const updatedBookstore = await prisma.bookstore.update({
      where: {id: id},
      data: {
        name: name,
        comissions: comissions,
        deal_percentage: parseFloat(dealPercentage),
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
      }
    });

    updatePaymentsOnCascadeFromBookstore(updatedBookstore);

    res.status(200).json({message: "Successfully updated bookstore"});
  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
    res.status(500).json({error: "There was an issue updating the bookstore"});
  }
});

router.delete('/bookstore/:id', async (req, res) => {
  const bookstore_id = parseInt(req.params.id);

  try {
    const deletedBookstore = await prisma.bookstore.update({where:
      {id: bookstore_id},
      data: {
        isDeleted: true
      }
    });

    if (deletedBookstore) {
      const deletedInventoriesIds = await softDeleteInventoriesOnCascade([bookstore_id], "bookstores");
      await softDeleteSalesOnCascade(deletedInventoriesIds);
    }

    res.status(200).json({message: "La libreria ha sido eliminada con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the bookstore'});
  }
})

/// Inventories routes

router.get('/inventories', async (req, res) => {
  try {
    // const cachedData = await redisClient.get("authorsList");

    // if (cachedData) {
    //   console.log(cachedData);
    //   return res.json(JSON.parse(cachedData));
    // }

    const inventories = await prisma.inventory.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        bookId: true,
        book: {
          select: {
            title: true,
            impressions: {
              where: {
                isDeleted: false
              },
              select: {
                id: true,
                quantity: true,
                note: true,
                createdAt: true
              }
            }
          }
        },
        bookstoreId: true,
        bookstore: {
          select: {
            name: true
          }
        },
        country: true,
        price: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          where: {
            isDeleted: false
          },
          select: {
            quantity: true
          }
        }
      },
      orderBy: {
        book: {
          title: 'asc'
        }
      }
    });

    for (const inventory of inventories) {
      let totalSales = 0;
      for (const sale of inventory.sales) {
        totalSales += sale.quantity
      }
      inventory["totalSales"] = totalSales
    }

    // await redisClient.set("authorsList", JSON.stringify(users));

    res.json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventories route"});
  }
});

// router.get('/inventoryNames', async (req, res) => {
//   try {
//     const inventoryNames = await prisma.inventory.findMany({
//       where: {
//         isDeleted: false
//       },
//       select: {
//         id: true,
//         bookId: true,
//         bookstoreId: true,
//         book: {
//           select: {
//             title: true
//           }
//         },
//         bookstore: {
//           select: {
//             name: true
//           }
//         }
//       }
//     });

//     res.status(200).json(inventoryNames);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({error: "Server error at inventoryNames route"});
//   }
// })

router.get('/inventoryNames', async (req, res) => {
  try {
    const bookInventoryNames = await prisma.book.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        title: true
      }
    });
    
    const bookstoreInventoryNames = await prisma.bookstore.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true
      }
    })

    let inventoryNames = [];
    for (const book of bookInventoryNames) {
      const formatted = {
        "name": book.title,
        "type": "book",
        "id": book.id
      }
      inventoryNames.push(formatted)
    }

    for (const bookstore of bookstoreInventoryNames) {
      const formatted = {
        "name": bookstore.name,
        "type": "bookstore",
        "id": bookstore.id
      }
      inventoryNames.push(formatted)
    }

    res.status(200).json(inventoryNames);
  } catch (error) {
    console.log(error);
    res.status(500).json({error: "Server error at inventoryNames route"});
  }
})

router.get('/inventoriesByBook/:id', async (req, res) => {
  try {
    const queryBookId = parseInt(req.params.id);
    const thatBookImpressions = await prisma.impression.findMany({
      where: {
        bookId: queryBookId,
        isDeleted: false
      },
      select: {
        id: true,
        quantity: true,
        note: true,
        isDeleted: true,
        createdAt: true
      }
    })

    const thatBookInventories = await prisma.inventory.findMany({
      where: {
        bookId: queryBookId,
        isDeleted: false
      },
      select: {
        id: true,
        bookstore: {
          select: {
            name: true
          }
        },
        bookstoreId: true,
        book: {
          select: {
            title: true
          }
        },
        bookId: true,
        country: true,
        price: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          select: {
            quantity: true,
            isDeleted: true
          }
        }
      }
    })

    const relevantInventories = [];
    let currentTotal = 0;
    let initialTotal = 0;
    let returnsTotal = 0;
    let givenToAuthorTotal = 0;
    let soldTotal = 0;
    for (const inventory of thatBookInventories) {
      let thisInventorySalesTotal = 0
      currentTotal += inventory.current;
      initialTotal += inventory.initial;
      returnsTotal += inventory.returns;
      givenToAuthorTotal += inventory.givenToAuthor;
      for (const sale of inventory.sales) {
        if (sale.isDeleted === false) {
          soldTotal += sale.quantity
          thisInventorySalesTotal += sale.quantity
        }
      }
      const inventoryPlusSales = {...inventory, totalSales: thisInventorySalesTotal}
      relevantInventories.push(inventoryPlusSales);
    }
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    const payload = {
      sortedRelevantInventories,
      currentTotal,
      initialTotal,
      returnsTotal,
      givenToAuthorTotal,
      soldTotal,
      thatBookImpressions
    }

    res.status(200).json(payload);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventoriesByBook route"});
  }
})

router.get('/inventoriesByBookstore/:id', async (req, res) => {
  try {
    const queryBookstoreId = parseInt(req.params.id);

    const thatBookstoreInventories = await prisma.inventory.findMany({
      where: {
        bookstoreId: queryBookstoreId,
        isDeleted: false
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
            name: true
          }
        },
        bookstoreId: true,
        price: true,
        country: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          select: {
            quantity: true,
            isDeleted: true
          }
        }
      }
    })

    const relevantInventories = [];
    let currentTotal = 0;
    let initialTotal = 0;
    let returnsTotal = 0;
    let givenToAuthorTotal = 0;
    let soldTotal = 0;
    for (const inventory of thatBookstoreInventories) {
      let thisInventorySalesTotal = 0
      currentTotal += inventory.current;
      initialTotal += inventory.initial;
      returnsTotal += inventory.returns;
      givenToAuthorTotal += inventory.givenToAuthor;
      for (const sale of inventory.sales) {
        if (sale.isDeleted === false) {
          soldTotal += sale.quantity
          thisInventorySalesTotal += sale.quantity
        }
      }
      const inventoryPlusSales = {...inventory, totalSales: thisInventorySalesTotal}
      relevantInventories.push(inventoryPlusSales);
    }
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    const payload = {
      sortedRelevantInventories,
      currentTotal,
      initialTotal,
      returnsTotal,
      givenToAuthorTotal,
      soldTotal,
    }

    res.status(200).json(payload);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventoriesByBook route"});
  }
})

router.get('/inventoriesCurrentTotals', async (req, res) => {
  try {
    const currentTotals = await prisma.inventory.groupBy({
      by: ['bookstoreId'],
      where: {
        isDeleted: false
      },
      _sum: {
        current: true
      }
    })

    const withNames = await Promise.all(
      currentTotals.map(async (group) => {
        const bookstore = await prisma.bookstore.findUnique({
          where: { id: group.bookstoreId },
          select: { name: true }
        });

        return {
          ...group,
          bookstoreName: bookstore?.name || null
        };
      })
    );

    res.status(200).json(withNames);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventoriesCurrentTotals route"});
  }
})

router.patch('/inventory', async (req, res) => {
  try {
    const {
      id,
      book,
      bookstore,
      country,
      inicial,
      price
    } = req.body;
    const currentInventory = await prisma.inventory.findUnique({
      where: {id: id}
    });
    const difference = inicial - currentInventory.initial
    let updatedInventory = await prisma.inventory.update({
      where: {id: id},
      data: {
        bookId: book,
        bookstoreId: bookstore,
        country: country,
        initial: inicial,
        price: price
      }
    });
    if (updatedInventory.current > updatedInventory.initial) {
      updatedInventory = await prisma.inventory.update({
        where: {id: id},
        data: {current: updatedInventory.initial}
      })
    } else {
      updatedInventory = await prisma.inventory.update({
        where: {id: id},
        data: {current: updatedInventory.current + difference}
      })
    }

    updatePaymentsOnCascadeFromInventory(updatedInventory, currentInventory.price);

    if (updatedInventory) {
      res.status(200).json({message: "Successfully updated inventory"});
    } else {
      if (String(error).includes(("Unique constraint failed on the fields: (`bookId`,`bookstoreId`,`country`)"))) {
        res.status(500).json({message: "Este inventario ya existe"})
        return;
      }
      res.status(500).json({error: "There was an issue updating the bookstore"});
    };

  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
  }
});

router.delete('/inventory/:id', async (req, res) => {
  const inventory_id = parseInt(req.params.id);

  try {
    const deletedInventory = await prisma.inventory.update({where:
      {id: inventory_id},
      data: {
        isDeleted: true
      }
    });

    if (deletedInventory) {
      await softDeleteSalesOnCascade([inventory_id]);
    }

    res.status(200).json({message: "El inventario ha sido eliminado con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the inventory'});
  }
})

/// Sales routes


router.get('/sales', async (req, res) => {
  try {
    // const cachedData = await redisClient.get("authorsList");

    // if (cachedData) {
    //   console.log(cachedData);
    //   return res.json(JSON.parse(cachedData));
    // }

    const sales = await prisma.sale.findMany({
      where: {
        isDeleted: false,
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
        updatedAt: true
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    // await redisClient.set("authorsList", JSON.stringify(users));
    sales.map((sale) => {
      sale.completeInventory = sale.inventory.book.title + ", " + sale.inventory.bookstore.name + ", " + sale.inventory.country
      sale.createdAt = sale.createdAt.toLocaleString();
      sale.updatedAt = sale.updatedAt.toLocaleString();
    })

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at sales route"});
  }
});

router.post('/sale', async (req, res) => {
  try {
    const {
      book,
      bookstore,
      country,
      quantity
    } = req.body;

    const selectedInventory = await prisma.inventory.findUnique({where : {
      bookId_bookstoreId_country: {
        bookId : book,
        bookstoreId: bookstore,
        country: country
      }}});

    if (!selectedInventory) {
      res.status(400).json({ message: "No existe un inventario con esta combinación de titulo, librería y país"});
      return;
    }

    if (selectedInventory.current < quantity) {
      res.status(400).json({ message: "El inventario tiene menos libros que la cantidad entrada."});
      return;
    }

    const createdSale = await prisma.sale.create({
      data: {
        inventoryId: selectedInventory.id,
        quantity: quantity
      },
      include: {
        inventory: {
          include: {
            bookstore: true
          }
        }
      }
    });

    if (createdSale) {
      const updatedInventory = await prisma.inventory.update({
        where: {id: selectedInventory.id},
        data: {
          current: selectedInventory.current-quantity
        }
      });

      // update all potential authors payments sums as well
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const currentForMonth = year + "-" + month;

      const bookOfSale = await prisma.book.findUnique({
        where: {
          id: updatedInventory.bookId
        },
        select: {
          users: {
            select: {
              id: true
            }
          }
        }
      })
      const userIds = bookOfSale.users.map(user => user.id);

      // update the payment for each author of the book
      if (userIds.length > 0) {
        for (const id of userIds) {
          // using findMany instead of findUnique here to avoid the error if not found.
          const relatedPayment = await prisma.payment.findMany({
            where: {
              userId: id,
              forMonth: currentForMonth
            }
          })

          const userCategory = await prisma.user.findUnique({
            where: {
              id: id,
              isDeleted: false
            },
            select: {
              category: {
                select: {
                  percentage_royalties: true,
                  percentage_management_stores: true,
                  management_min: true
                }
              }
            }
          })

          if (relatedPayment.length === 0) {
            const createdPayment = await prisma.payment.create({
              data: {
                userId: id,
                amount: 
                  createdSale.inventory.bookstore.comissions 
                    ? (createdSale.inventory.price 
                      - userCategory.category.management_min) 
                      * createdSale.quantity 
                      / userIds.length
                    : createdSale.inventory.price
                      * createdSale.quantity 
                      * (userCategory.category.percentage_management_stores / 100)
                      * (userCategory.category.percentage_royalties / 100)
                      / userIds.length,
                forMonth: currentForMonth
              }
            })
          } else {
            const updatedRelatedPayment = await prisma.payment.update({
              where: {
                id: relatedPayment[0].id
              },
              data: {
                amount: createdSale.inventory.bookstore.comissions 
                    ? (createdSale.inventory.price 
                      - userCategory.category.management_min) 
                      * createdSale.quantity 
                      / userIds.length
                    : createdSale.inventory.price
                      * createdSale.quantity 
                      * (userCategory.category.percentage_management_stores / 100)
                      * (userCategory.category.percentage_royalties / 100)
                      / userIds.length,
              }
            })
          }
        }
      }
    }

    res.status(201).json(createdSale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
})

router.patch('/sale', async (req, res) => {
  try {
    const {
      id,
      book,
      bookstore,
      country,
      quantity
    } = req.body;

    const selectedInventory = await prisma.inventory.findUnique({where : {
      bookId_bookstoreId_country: {
        bookId : book,
        bookstoreId: bookstore,
        country: country
      }}});

    if (!selectedInventory) {
      res.status(400).json({ message: "No existe un inventario con esta combinación de titulo, librería y país"});
      return;
    }

    const previousSale = await prisma.sale.findUnique({where: {id: id}});
    let quantityUpdate = previousSale.quantity - quantity;
    console.log("previousSale.quantity", previousSale.quantity)
    console.log("quantityUpdate", quantityUpdate);
    console.log("selectedInventory.current",selectedInventory.current)

    if ((selectedInventory.current + quantityUpdate) < 0) {
      res.status(400).json({ message: "El inventario tiene menos libros que la cantidad entrada."});
      return;
    }

    const updatedSale = await prisma.sale.update({
      where: {id: id},
      data: {
        inventoryId: selectedInventory.id,
        quantity: quantity
      },
      include: {
        inventory: {
          include: {
            book: true,
            bookstore: true
          }
        }
      }
    });

    console.log("updatedSale.quantity", updatedSale.quantity);
    console.log("updatedSale.createdAt", updatedSale.createdAt);

    if (updatedSale) {
      const updatedInventory = await prisma.inventory.update({
        where: {id: selectedInventory.id},
        data: {
          current: selectedInventory.current + quantityUpdate
        }
      });

      // update all potential authors payments sums as well
      const date = new Date(updatedSale.createdAt);
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const currentForMonth = year + "-" + month

      const bookOfSale = await prisma.book.findUnique({
        where: {
          id: updatedInventory.bookId
        },
        select: {
          users: {
            select: {
              id: true
            }
          }
        }
      })
      const userIds = bookOfSale.users.map(user => user.id);

      // update the payment for each author of the book
      if (userIds.length > 0) {
        for (const id of userIds) {
          // using findMany instead of findUnique here to avoid the error if not found.
          const relatedPayment = await prisma.payment.findMany({
            where: {
              userId: id,
              forMonth: currentForMonth,
              isDeleted: false
            }
          })

          const userCategory = await prisma.user.findUnique({
            where: {
              id: id,
              isDeleted: false
            },
            select: {
              category: {
                select: {
                  percentage_royalties: true,
                  percentage_management_stores: true,
                  management_min: true
                }
              }
            }
          })

          if (relatedPayment.length === 0) {
            const createdPayment = await prisma.payment.create({
              data: {
                userId: id,
                amount: 
                  updatedSale.inventory.bookstore.comissions 
                    ? (updatedSale.inventory.price 
                      - userCategory.category.management_min) 
                      * quantityUpdate
                      / userIds.length
                    : updatedSale.inventory.price
                      * quantityUpdate
                      * (userCategory.category.percentage_management_stores / 100)
                      * (userCategory.category.percentage_royalties / 100)
                      / userIds.length,
                forMonth: currentForMonth
              }
            })
          } else {
            const updatedRelatedPayment = await prisma.payment.update({
              where: {
                id: relatedPayment[0].id
              },
              data: {
                amount: updatedSale.inventory.bookstore.comissions 
                    ? relatedPayment[0].amount 
                      - ((updatedSale.inventory.price 
                      - userCategory.category.management_min) 
                      * quantityUpdate 
                      / userIds.length)
                    : relatedPayment[0].amount
                      - (updatedSale.inventory.price
                      * quantityUpdate 
                      * (userCategory.category.percentage_management_stores / 100)
                      * (userCategory.category.percentage_royalties / 100)
                      / userIds.length),
              }
            })
          }
        }
      }

      res.status(200).json({message: "Successfully updated sale"});
    } else {
      if (String(error).includes(("Unique constraint failed on the fields: (`bookId`,`bookstoreId`,`country`)"))) {
        res.status(500).json({message: "Este inventario ya existe"})
        return;
      }
      res.status(500).json({error: "There was an issue updating the sale"});
    };

  } catch(error) {
    console.error("Server error at the update sale route:", error);
    res.status(500).json({error: "There was an issue updating the sale"});
  }
});

router.delete('/sale/:id', async (req, res) => {
  const sale_id = parseInt(req.params.id);
  const inventory_id = parseInt(req.query.inventory_id);
  const quantity = parseInt(req.query.quantity);
  try {
    const deletedSale = await prisma.sale.update({where:
      {id: sale_id},
      data: {
        isDeleted: true
      },
      include: {
        inventory: {
          include: {
            bookstore: true
          }
        }
      }
    });

    if (deletedSale) {
      const selectedInventory = await prisma.inventory.findUnique({where: {id: inventory_id}});
      const updatedInventory = await prisma.inventory.update({
        where: {id: inventory_id},
        data: {
          current: selectedInventory.current + quantity
        }
      });

      // update all potential authors payments sums as well
      const date = new Date(deletedSale.createdAt);
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const currentForMonth = year + "-" + month

      const bookOfSale = await prisma.book.findUnique({
        where: {
          id: updatedInventory.bookId
        },
        select: {
          users: {
            select: {
              id: true
            }
          }
        }
      })
      const userIds = bookOfSale.users.map(user => user.id);

      // update the payment for each author of the book
      if (userIds.length > 0) {
        for (const id of userIds) {
          // using findMany instead of findUnique here to avoid the error if not found.
          const relatedPayment = await prisma.payment.findMany({
            where: {
              userId: id,
              forMonth: currentForMonth,
              isDeleted: false
            }
          })

          const userCategory = await prisma.user.findUnique({
            where: {
              id: id,
              isDeleted: false
            },
            select: {
              category: {
                select: {
                  percentage_royalties: true,
                  percentage_management_stores: true,
                  management_min: true
                }
              }
            }
          })

          const updatedRelatedPayment = await prisma.payment.update({
            where: {
              id: relatedPayment[0].id
            },
            data: {
              amount: deletedSale.inventory.bookstore.comissions 
                  ? relatedPayment[0].amount 
                    - ((deletedSale.inventory.price 
                    - userCategory.category.management_min) 
                    * quantity 
                    / userIds.length)
                  : relatedPayment[0].amount
                    - (deletedSale.inventory.price
                    * quantity
                    * (userCategory.category.percentage_management_stores / 100)
                    * (userCategory.category.percentage_royalties / 100)
                    / userIds.length),
            }
          })
        }
      }
    }

    res.status(200).json({message: "La venta ha sido eliminada con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the sale'});
  }
})


/// Impression routes
router.post('/impression', async (req, res) => {
  try {
    const quantity = parseInt(req.body.quantity);
    const id = parseInt(req.body.id);
    const note = (req.body.note);

    const createdImpression = await prisma.impression.create({
      data: {
        bookId: id,
        quantity: quantity,
        note: note
      }
    })

    const wasInventory = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId_country: {
          bookId: id,
          bookstoreId: 3,
          country: "México"
        }
      }
    });

    if (wasInventory && !wasInventory.isDeleted) {
      const updatedInventory = await prisma.inventory.update({
        where: {id: wasInventory.id},
        data: {
          current: wasInventory.current + quantity,
          initial: wasInventory.initial + quantity
        }
      })
    };

    res.status(201).json(createdImpression);
  } catch (error) {
    console.error("\n ERROR CREATING THE IMPRESSION: \n", error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
})

router.delete('/impression/:id', async (req, res) => {
  try {
    const impression_id = parseInt(req.params.id);
    const book_id = parseInt(req.query.book_id);
    const quantity = parseInt(req.query.quantity);
    const updatedImpression = await prisma.impression.update({
      where: {id: impression_id},
      data: {
        isDeleted: true
      }
    })

    const wasInventory = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId_country: {
          bookId: book_id,
          bookstoreId: 3,
          country: "México"
        }
      }
    });

    if (wasInventory && !wasInventory.isDeleted) {
      const updatedInventory = await prisma.inventory.update({
        where: {id: wasInventory.id},
        data: {
          current: wasInventory.current - quantity,
          initial: wasInventory.initial - quantity
        }
      })
    }
    res.status(200).json(updatedImpression);
  } catch (error) {
    console.error('\n ERROR WHILE DELETING THE IMPRESSION: \n', error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
});

router.patch('/impression', async (req, res) => {
  try {
    const {
      id,
      quantity,
      book_id
    } = req.body;

    const currentImpression = await prisma.impression.findUnique({ where: {id: id}});
    const diff = parseInt(quantity) - currentImpression.quantity;

    const updatedImpression = await prisma.impression.update({
      where: {id: id},
      data: {
        quantity: parseInt(quantity)
      }
    });

    const wasInventory = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId_country: {
          bookId: book_id,
          bookstoreId: 3,
          country: "México"
        }
      }
    });

    if (wasInventory && !wasInventory.isDeleted) {
      const updatedInventory = await prisma.inventory.update({
        where: {id: wasInventory.id},
        data: {
          current: wasInventory.current + diff,
          initial: wasInventory.initial + diff
        }
      })
    }
    res.status(200).json(updatedImpression);
  } catch(error) {
    console.error('\n ERROR WHILE UPDATING THE IMPRESSI0N: \n', error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
})

/// Transfer route

router.post('/transfer', async (req, res) => {
  try {
    const {
      bookstoreTo,
      bookstoreToId,
      bookstoreFromId,
      quantity,
      inventoryFromId,
      bookId,
      type,
      note,
      deliveryDate,
      place,
      person,
      country
    } = req.body;

    const dateInDateTime = new Date(deliveryDate);

    // Start by getting the inventoryFrom
    const currentInventoryFrom = await prisma.inventory.findUnique({
      where: {
        id: parseInt(inventoryFromId),
        isDeleted: false
      }
    });

    // Route 1 : delivered to Author
    if (type === "send" && !bookstoreToId) {

      if (country !== "México") {
        res.status(400).json({message: "Una entrega al autor debe estar hecho desde el inventario de Was del libro en Mexico"})
        return;
      }

      const newTransferToAuthor = await prisma.transfer.create({
        data: {
          fromInventoryId: inventoryFromId,
          quantity: parseInt(quantity),
          note: note,
          deliveryDate: dateInDateTime,
          place: place,
          person: person
        }
      });

      if(newTransferToAuthor) {
        const updatedFromInventory = await prisma.inventory.update({
          where: {id: inventoryFromId},
          data: {
            givenToAuthor: currentInventoryFrom.givenToAuthor + parseInt(quantity),
            current: currentInventoryFrom.current - parseInt(quantity)
          }
        });
      };

      res.status(200).json(newTransferToAuthor);
      return;
    }

    // Route 2: Return and Send
    // Get the inventoryTo if it exists
    let currentInventoryTo = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId_country: {
          bookId: parseInt(bookId),
          bookstoreId: parseInt(bookstoreToId),
          country: country
        },
        isDeleted: false
      }
    });

    let newInventoryTo;
    let recoveredInventoryTo;

    // if it doesnt exist check if it isn't soft deleted. 1/ Get it if deleted
    if (!currentInventoryTo) {
      const deletedInventoryMaybe = await prisma.inventory.findUnique({
        where: {
          bookId_bookstoreId_country: {
            bookId: parseInt(bookId),
            bookstoreId: parseInt(bookstoreToId),
            country: country
          },
          isDeleted: true
        }
      });

      // 2/ If it is not, create it.
      if (!deletedInventoryMaybe) {
        newInventoryTo = await prisma.inventory.create({
          data: {
            bookId: parseInt(bookId),
            bookstoreId: parseInt(bookstoreToId),
            country: country,
            initial: parseInt(quantity),
            current: parseInt(quantity)
          }
        });
      // 3/ Otherwise recover it
      } else {
        recoveredInventoryTo = await prisma.inventory.update({
          where: {id: deletedInventoryMaybe.id},
          data: {
            isDeleted: false,
            current: parseInt(quantity),
            initial: parseInt(quantity)
          }
        });
      }
    };

    // 4/ Set it to current
    if (newInventoryTo) {
      currentInventoryTo = newInventoryTo
    };

    if (recoveredInventoryTo) {
      currentInventoryTo = recoveredInventoryTo
    }

    // 5-Create the actual transfer now that you got the proper inventory To and From
    const newTransfer = await prisma.transfer.create({
      data: {
        fromInventoryId: parseInt(inventoryFromId),
        toInventoryId: parseInt(currentInventoryTo.id),
        quantity: parseInt(quantity),
        type: type
      }
    });

    // 6- If creating the inventory succeeded, proceed further
    // (don't want to proceed further if that step fails for whichever reason)
    if (newTransfer) {
      // If it's a send - update both From and To inventories
      if (newTransfer.type === "send") {
        const updatedInventoryFrom = await prisma.inventory.update({
          where: {id: parseInt(inventoryFromId)},
          data: {
            current: currentInventoryFrom.current - parseInt(quantity),
            initial: currentInventoryFrom.initial - parseInt(quantity)
          }
        });
        // update inventoryTo if you ddn't just created or recovered it (they would already be updated)
        if (!newInventoryTo && !recoveredInventoryTo) {
          const updatedInventoryTo = await prisma.inventory.update({
            where: {id: currentInventoryTo.id},
            data: {
              current: currentInventoryTo.current + parseInt(quantity),
              initial: currentInventoryTo.initial + parseInt(quantity)
            }
          });
        }
      // If it's a return - same process
      } else {
        const updatedInventoryFrom = await prisma.inventory.update({
          where: {id: parseInt(inventoryFromId)},
          data: {
            current: currentInventoryFrom.current - parseInt(quantity),
            returns: currentInventoryFrom.returns + parseInt(quantity),
          }
        });

        if (!newInventoryTo && !recoveredInventoryTo) {
          const updatedInventoryTo = await prisma.inventory.update({
            where: {id: currentInventoryTo.id},
            data: {
              current: currentInventoryTo.current + parseInt(quantity),
              initial: currentInventoryTo.initial + parseInt(quantity),
            }
          });
        }
      }

    }

    res.status(200).json(newTransfer)
  } catch (error) {
    console.error("\n ERROR WHILE CREATING TRANSFER \n", error);
    res.status(500).json({error: "a server error occurred while creating the transfer"})
  }
})

/// Payments routes
router.get('/payments', async (req, res) => {
  const chosenPaymentStatus = req.query.status;
  try {
    const selectedPayments = await prisma.payment.findMany({
      where: {
        isDeleted: false,
        status: chosenPaymentStatus
      },
      select: {
        id: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            id: true
          }
        },
        amount: true,
        forMonth: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json(selectedPayments);

  } catch (error) {
    console.error("\n ERROR FETCHING PAYMENTS \n", error);
    res.status(500).json({error: "a server error occurred while fetching payments"})
  }
})

router.patch('/markAsPaid/:id', async (req, res) => {
  try {
    const queryPaymentId = parseInt(req.params.id)
    const updatedPayment = await prisma.payment.update({
      where: {
        id: queryPaymentId,
        isDeleted: false
      },
      data: {
        status: 'paid'
      }
    })

    if (updatedPayment) {
      res.status(200).json({message: "Successfully marked payment as paid"})
    }

  } catch(error) {
    console.error("\n ERROR MARKING PAYMENT AS PAID \n", error);
    res.status(500).json({error:"a server error occurred while fetching payments"})
  }
})

/// Costs routes

router.get('/currentCosts', async (req, res) => {
  try {
    const currentCosts = await prisma.cost.findMany({
      where: {
        isDeleted: false,
        payment: {
          status: "created",
          isDeleted: false
        }
      },
      select: {
        id: true,
        paymentId: true,
        note: true,
        amount: true,
        payment: {
          select: {
            forMonth: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      }
    })

    if (currentCosts) {
      res.status(200).json(currentCosts);
    }
  } catch(error) {
    console.error("\n ERROR getting current costs from server \n", error);
    res.status(500).json({error:"a server error occurred while fetching payments"})
  }
})

router.post('/cost', async (req, res) => {
  try {
    const { 
      paymentId,
      amount,
      note
    } = req.body;

    const createdCost = await prisma.cost.create({
      data: {
        paymentId: paymentId,
        amount: amount,
        note: note
      }
    });

    if (createdCost) {
      const previousPayment = await prisma.payment.findUnique({
        where: {
          id: paymentId
        },
        select: {
          amount: true
        }
      });

      const updatedPayment = await prisma.payment.update({
        where: {
          id: paymentId
        },
        data: {
          amount: previousPayment.amount - createdCost.amount
        }
      })
      res.status(200).json({message: "Cost created sucessfully"});
    }
  } catch (error) {
    console.error("\n ERROR CREATING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while creating the cost"})
  }
})

router.patch("/cost/:id", async (req, res) => {
  try {
    const costId = parseInt(req.params.id);
    const {
      amount,
      note
    } = req.body;

    const previousCost = await prisma.cost.findUnique({
      where: {
        id: costId
      }
    })
    
    const updatedCost = await prisma.cost.update({
      where: {
        id: costId
      },
      data: {
        amount: amount,
        note: note
      }
    })

    if (updatedCost) {
      const previousPayment = await prisma.payment.findUnique({
        where: {
          id: updatedCost.paymentId
        }
      });

      if (previousPayment) {
        const updatedPayment = await prisma.payment.update({
          where: {
            id: updatedCost.paymentId
          },
          data: {
            amount: previousPayment.amount + previousCost.amount - updatedCost.amount
          }
        })
      }
    }
    res.status(200).json({message: "The cost was updated successfully"});
  } catch (error) {
    console.error("\n ERROR UPDATING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while updating the cost"})
  }
}) 

router.delete('/cost/:id', async (req, res) => {
  try {
    const costId = parseInt(req.params.id);
    const markedAsDeletedCost = await prisma.cost.update({
      where: {
        id: costId
      },
      data: {
        isDeleted: true
      }
    });

    if (markedAsDeletedCost) {
      const previousPayment = await prisma.payment.findUnique({
        where: {
          id: markedAsDeletedCost.paymentId
        }
      });

      if (previousPayment) {
        const updatedPayment = await prisma.payment.update({
          where: {
            id: markedAsDeletedCost.paymentId
          },
          data: {
            amount: previousPayment.amount + markedAsDeletedCost.amount
          }
        })
      }
    }

    res.status(200).json({message: "The cost was deleted successfully"});
  } catch (error) {
    console.error("\n ERROR DELETING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while deleting the cost"})
  }
})

/// soft delete on cascade

async function softDeleteBooksOnCascade(deletedAuthor) {
  const booksToDelete = await prisma.book.findMany({
    where: {
      users: {
        some: {
          id: deletedAuthor.id
        }
      },
      isDeleted: false
    },
    include: {
      users: true
    }
  });

  let deletedBooksIds = [];
  for (const book of booksToDelete) {
    if (book.users.length > 1) {
      continue
    } else {
      const deletedBook = await prisma.book.update({
        where: {id: book.id},
        data: {isDeleted: true}
      })
      deletedBooksIds.push(deletedBook.id);
    };
  };

  return deletedBooksIds;
}

async function softDeletePaymentsOnCascade(deletedAuthor) {
  const paymentsToDelete = await prisma.payment.findMany({
    where: {
      userId: deletedAuthor.id,
      isDeleted: false
    }
  })

  let deletedPaymentsIds=[];
  for (const payment of paymentsToDelete) {
    const deletedPayment = await prisma.payment.update({
      where: {
        id: payment.id
      },
      data: {
        isDeleted: true
      }
    })
    deletedPaymentsIds.push(deletedPayment.id)
  }

  return deletedPaymentsIds;
}

async function softDeleteInventoriesOnCascade(IdsList, cascadeType) {
  let filter = '';
  if (cascadeType === "books") {
    filter = "bookId"
  } else if (cascadeType === "bookstores") {
    filter = "bookstoreId"
  } else {
    console.log("There was an error soft deleting inventories on cascade");
    return;
  }

  let inventoriesToDelete = [];
  for (const id of IdsList) {
    const relatedInventories = await prisma.inventory.findMany({
      where: {[filter]: id}
    });
    for (const inventory of relatedInventories) {
      inventoriesToDelete.push(inventory.id);
    };
  };

  let deletedInventoriesIds = [];
  for (const inventoryId of inventoriesToDelete) {
    const deletedInventory =  await prisma.inventory.update({
      where: {id: inventoryId},
      data: {isDeleted: true},
    });
    deletedInventoriesIds.push(deletedInventory.id);
  };
  return deletedInventoriesIds;
}

async function softDeleteImpressionsOnCascade(deletedBook) {
  const impressionsToDelete = await prisma.impression.findMany({
    where: {
      bookId: deletedBook.id,
      isDeleted: false
    },
  });

  let deletedImpressionsIds = [];
  for (const impression of impressionsToDelete) {
    const deletedImpression = await prisma.impression.update({
      where : {id: impression.id},
      data: {isDeleted: true}
    })
    deletedImpressionsIds.push(deletedImpression.id)
  };
  return deletedImpressionsIds;
}

async function softDeleteSalesOnCascade(IdsList) {
  let salesToDelete = [];

  for (const id of IdsList) {
    const relatedSales = await prisma.sale.findMany({
      where: {inventoryId: id},
      select: {
        id : true,
        quantity: true,
        createdAt: true,
        inventoryId: true,
        inventory: {
          select: {
            bookId: true,
            price: true,
            bookstore: {
              select: {
                comissions: true
              }
            }
          }
        }
      }
    });
    for (const sale of relatedSales) {
      salesToDelete.push(sale);
    }
  }

  await Promise.all(
    salesToDelete.map(async (sale) => {
      await prisma.sale.update({
        where: {id: sale.id},
        data: { isDeleted: true}
      })
    })
  );

  for (const sale of salesToDelete) {
    // update all potential authors payments sums as well
    const date = new Date(sale.createdAt);
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const saleForMonth = year + "-" + month

    const bookOfSale = await prisma.book.findUnique({
      where: {
        id: sale.inventory.bookId
      },
      select: {
        users: {
          select: {
            id: true
          }
        }
      }
    })
    const userIds = bookOfSale.users.map(user => user.id);

    // update the payment for each author of the book
    if (userIds.length > 0) {
      for (const id of userIds) {
        // using findMany instead of findUnique here to avoid the error if not found.
        const relatedPayment = await prisma.payment.findMany({
          where: {
            userId: id,
            forMonth: saleForMonth,
            isDeleted: false
          }
        })

        const userCategory = await prisma.user.findUnique({
          where: {
            id: id,
            isDeleted: false
          },
          select: {
            category: {
              select: {
                percentage_royalties: true,
                percentage_management_stores: true,
                management_min: true
              }
            }
          }
        })

        let newPaymentAmount = relatedPayment[0].amount - calculateAuthorRevenue(
          sale.inventory.bookstore.comissions,
          sale.inventory.price,
          userCategory.category.management_min,
          userCategory.category.percentage_management_stores,
          userCategory.category.percentage_royalties,
          sale.quantity,
          userIds.length
        )
        if (newPaymentAmount < 0.01) {
          newPaymentAmount = 0
        }
        const updatedRelatedPayment = await prisma.payment.update({
          where: {
            id: relatedPayment[0].id
          },
          data: {
            amount: newPaymentAmount
          }
        })
      }
    }
  }
}

async function softDeleteCostsOnCascade(deletedPaymentId) {
  const costsToDelete = await prisma.cost.findMany({
    where: {
      paymentId: deletedPaymentId,
      isDeleted: false
    }
  });

  let deletedCostsIds = [];
  for (const cost of costsToDelete) {
    const deletedCost = await prisma.cost.update({
      where: {id: cost.id},
      data: {isDeleted: true}
    });
    deletedCostsIds.push(deletedCost.id)
  };

  return deletedCostsIds;
}

// updateOnCascade routes

async function updatePaymentsOnCascade(category, previousCategory) {
  const impactedUsers = await prisma.user.findMany({
    where: {
      categoryId: category.id,
      isDeleted: false
    }
  });

  if (impactedUsers.length === 0) {
    return;
  }

  let impactedSales = [];
  for (const user of impactedUsers) {
    const impactedBooks = await prisma.book.findMany({
      where: {
        users: {
          some: {
            id: user.id
          }
        },
        isDeleted: false
      },
      include: {
        users: true
      }
    })

    for (const book of impactedBooks) {
      const numberOfAuthors = book.users.length
      const impactedInventories = await prisma.inventory.findMany({
        where: {
          bookId: book.id,
          isDeleted: false
        },
        include: {
          bookstore: true
        }
      })

      for (const inventory of impactedInventories) {
        const impactedSalesForInventory = await prisma.sale.findMany({
          where: {
            inventoryId: inventory.id,
            isDeleted: false
          }
        });
  
        for (const sale of impactedSalesForInventory) {
          impactedSales.push(
            {...sale, 
            "userId": user.id,
            "price": inventory.price,
            "comissions": inventory.bookstore.comissions,
            "numberOfAuthors": numberOfAuthors}
          )
        };
      }
    }
  }

  for (const sale of impactedSales) {
    const paymentForMonth = getForMonth(sale.createdAt);
    const previousSaleValue = calculateAuthorRevenue(
      sale.comissions,
      sale.price,
      previousCategory.management_min,
      previousCategory.percentage_management_stores,
      previousCategory.percentage_royalties,
      sale.quantity,
      sale.numberOfAuthors
    );
    const newSaleValue = calculateAuthorRevenue(
      sale.comissions,
      sale.price,
      category.management_min,
      category.percentage_management_stores,
      category.percentage_royalties,
      sale.quantity,
      sale.numberOfAuthors
    )

    const previousPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: sale.userId,
          forMonth: paymentForMonth,
        },
        isDeleted: false
      }
    });

    if (previousPayment && previousPayment.status !== "paid") {
      const updatedPayment = await prisma.payment.update({
        where: {
          userId_forMonth: {
            userId: sale.userId,
            forMonth: paymentForMonth,
          },
          isDeleted: false
        },
        data: {
          amount: previousPayment.amount + previousSaleValue - newSaleValue
        }
      })
    }
  }
}

async function updatePaymentsOnCascadeFromBookstore(bookstore) {
  let impactedSales = [];
  const impactedInventories = await prisma.inventory.findMany({
    where: {
      bookstoreId: bookstore.id,
      isDeleted: false
    },
    include: {
      bookstore: true
    }
  });

  for (const inventory of impactedInventories) {
    const impactedBook = await prisma.book.findFirst({
      where: {
        id: inventory.bookId,
        isDeleted: false
      },
      select: {
        users: {
          select: {
            id: true,
            category: {
              select: {
                percentage_management_stores: true,
                percentage_royalties: true,
                management_min: true
              }
            }
          }
        }
      }
    });

    const impactedUsers = impactedBook.users;

    const impactedSalesForInventory = await prisma.sale.findMany({
      where: {
        inventoryId: inventory.id,
        isDeleted: false
      }
    });

    for (const sale of impactedSalesForInventory) {
      for (const user of impactedUsers) {
        impactedSales.push(
          {...sale,
            "userId": user.id,
            "price": inventory.price,
            'management_min': user.category.management_min,
            "percentage_management_stores": user.category.percentage_management_stores,
            "percentage_royalties": user.category.percentage_royalties,
            "comissions": inventory.bookstore.comissions,
            "numberOfAuthors": impactedUsers.length
          }
        )
      }
    };
  }

  console.log("impactedSales.length", impactedSales.length);
  let count = 0;
  for (const sale of impactedSales) {
    count += 1
    console.log("count", count);
    const paymentForMonth = getForMonth(sale.createdAt);
    const previousSaleValue = calculateAuthorRevenue(
      !sale.comissions,
      sale.price,
      sale.management_min,
      sale.percentage_management_stores,
      sale.percentage_royalties,
      sale.quantity,
      sale.numberOfAuthors
    );
    const newSaleValue = calculateAuthorRevenue(
      sale.comissions,
      sale.price,
      sale.management_min,
      sale.percentage_management_stores,
      sale.percentage_royalties,
      sale.quantity,
      sale.numberOfAuthors
    )
    const previousPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: sale.userId,
          forMonth: paymentForMonth,
        },
        isDeleted: false
      }
    });
    if (previousPayment && previousPayment.status !== "paid") {
      const updatedPayment = await prisma.payment.update({
        where: {
          userId_forMonth: {
            userId: sale.userId,
            forMonth: paymentForMonth,
          },
          isDeleted: false
        },
        data: {
          amount: previousPayment.amount - previousSaleValue + newSaleValue
        }
      });
      console.log("updatedPayment.amount", updatedPayment.amount);
    }

    console.log("previousSaleValue", previousSaleValue);
    console.log("newSaleValue", newSaleValue);
    console.log("previousPayment.amount", previousPayment.amount);
    
    console.log("");
  }
}

async function updatePaymentsOnCascadeFromInventory(inventory, previousPrice) {
  let impactedSales = [];
  const impactedBook = await prisma.book.findFirst({
    where: {
      id: inventory.bookId,
      isDeleted: false
    },
    select: {
      users: {
        select: {
          id: true,
          category: {
            select: {
              percentage_management_stores: true,
              percentage_royalties: true,
              management_min: true
            }
          }
        }
      }
    }
  });

  const impactedUsers = impactedBook.users;
  const relatedBookstore = await prisma.bookstore.findFirst({
    where: {
      id: inventory.bookstoreId,
      isDeleted: false
    },
    select: {
      comissions: true
    }
  })

  const impactedSalesForInventory = await prisma.sale.findMany({
    where: {
      inventoryId: inventory.id,
      isDeleted: false
    }
  });

  for (const sale of impactedSalesForInventory) {
    for (const user of impactedUsers) {
      impactedSales.push(
        {...sale,
          "userId": user.id,
          "price": inventory.price,
          'management_min': user.category.management_min,
          "percentage_management_stores": user.category.percentage_management_stores,
          "percentage_royalties": user.category.percentage_royalties,
          "comissions": relatedBookstore.comissions,
          "numberOfAuthors": impactedUsers.length
        }
      )
    }
  };

  console.log("impactedSales.length", impactedSales.length);
  let count = 0;
  for (const sale of impactedSales) {
    count += 1

    console.log("");
    console.log("count", count);
    console.log("userId", sale.userId);
    console.log("sale.comissions", sale.comissions);
    console.log("previousPrice", previousPrice);
    console.log("sale.price", sale.price);
    console.log("sale.management_min", sale.management_min);
    console.log("sale.percentage_management_stores", sale.percentage_management_stores);
    console.log("sale.percentage_royalties", sale.percentage_royalties);
    console.log("sale.quantity", sale.quantity);
    console.log("sale.numberOfAuthors", sale.numberOfAuthors);

    const paymentForMonth = getForMonth(sale.createdAt);
    const previousSaleValue = calculateAuthorRevenue(
      sale.comissions,
      previousPrice,
      sale.management_min,
      sale.percentage_management_stores,
      sale.percentage_royalties,
      sale.quantity,
      sale.numberOfAuthors
    );
    const newSaleValue = calculateAuthorRevenue(
      sale.comissions,
      sale.price,
      sale.management_min,
      sale.percentage_management_stores,
      sale.percentage_royalties,
      sale.quantity,
      sale.numberOfAuthors
    )
    const previousPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: sale.userId,
          forMonth: paymentForMonth,
        },
        isDeleted: false
      }
    });
    if (previousPayment && previousPayment.status !== "paid") {
      const updatedPayment = await prisma.payment.update({
        where: {
          userId_forMonth: {
            userId: sale.userId,
            forMonth: paymentForMonth,
          },
          isDeleted: false
        },
        data: {
          amount: previousPayment.amount - previousSaleValue + newSaleValue
        }
      });
      // console.log("updatedPayment.amount", updatedPayment.amount);
    }

    // console.log("previousSaleValue", previousSaleValue);
    // console.log("newSaleValue", newSaleValue);
    // console.log("previousPayment.amount", previousPayment.amount);
    // console.log("");
  }
}

function calculateAuthorRevenue(
  onComission, 
  price, 
  management, 
  storeCutPercent, 
  royaltiesPercent, 
  quantity, 
  numberOfAuthors) {
    let res = 0;
    if (onComission) {
      res = ((price - management) * quantity / numberOfAuthors)
    } else {
      res = (price * quantity * (storeCutPercent / 100) * (royaltiesPercent / 100) / numberOfAuthors)
    }

    if (res < 0.001) {
      res = 0
    }

    return res
}

function getForMonth(timestamp) {
  const date = new Date(timestamp);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const forMonth = year + "-" + month
  return forMonth
}

// async function updatePaymentsFromSales(impactedSales) {
//   console.log("impactedSales.length", impactedSales.length);
//   let count = 0;
//   for (const sale of impactedSales) {
//     count += 1
//     console.log("count", count);
//     const paymentForMonth = getForMonth(sale.createdAt);
//     const previousSaleValue = calculateAuthorRevenue(
//       sale.comissions,
//       sale.price,
//       previousCategory.management_min,
//       previousCategory.percentage_management_stores,
//       previousCategory.percentage_royalties,
//       sale.quantity,
//       sale.numberOfAuthors
//     );
//     const newSaleValue = calculateAuthorRevenue(
//       sale.comissions,
//       sale.price,
//       category.management_min,
//       category.percentage_management_stores,
//       category.percentage_royalties,
//       sale.quantity,
//       sale.numberOfAuthors
//     )
//     const previousPayment = await prisma.payment.findUnique({
//       where: {
//         userId_forMonth: {
//           userId: sale.userId,
//           forMonth: paymentForMonth,
//         },
//         isDeleted: false
//       }
//     });
//     if (previousPayment) {
//       const updatedPayment = await prisma.payment.update({
//         where: {
//           userId_forMonth: {
//             userId: sale.userId,
//             forMonth: paymentForMonth,
//           },
//           isDeleted: false
//         },
//         data: {
//           amount: previousPayment.amount + previousSaleValue - newSaleValue
//         }
//       })
//     }
//   }
// }

export default router;
