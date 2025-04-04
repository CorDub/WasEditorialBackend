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
      where: {id: id},
      data: {
        first_name: first_name,
        last_name: last_name,
        country: country,
        referido: referido,
        email: email,
        category: {
          connect: {
            id: categoryId
          }
        }
      }
    });

    console.log(updatedAuthor);
    if (updatedAuthor) {
      res.status(200).json({message: "Successfully updated user"});
    } else {
      res.status(500).json({error: "There was an issue updating the author"});
    };

  } catch(error) {
    console.error("Server error at the update user route:", error);
  }
})

router.delete('/user', async (req, res) => {
  const user_id = parseInt(req.query.user_id);

  try {
    const deletedAuthor = await prisma.user.update({
      where: {id: user_id},
      data: {isDeleted: true}
    });

    if (deletedAuthor) {
      const deletedBooksIds = await softDeleteBooksOnCascade(deletedAuthor);
      const deletedInventoriesIds = await softDeleteInventoriesOnCascade(deletedBooksIds, "books");
      await softDeleteSalesOnCascade(deletedInventoriesIds);
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

router.delete('/category', async (req, res) => {
  const category_id = parseInt(req.query.category_id);

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
        type: {type}
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
    const updatedCategory = await prisma.category.update({
      where: {id: id},
      data: {
        type: tipo,
        percentage_royalties: parseInt(regalias),
        percentage_management_stores: parseInt(gestionTiendas),
        management_min: parseInt(gestionMinima),
      }
    });

    console.log(updatedCategory);
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

// Book routes

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
        price: parseFloat(price),
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

router.delete('/book', async (req, res) => {
  const book_id = parseInt(req.query.book_id);

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
      price,
      isbn,
      authors } = req.body;

    const authorsIds = []
    authors.map((author) => {
      authorsIds.push({"id": author.id});
    })

    const updatedBook = await prisma.book.update({
      where: {id: id},
      data: {
        title: title,
        pasta: pasta,
        price: parseFloat(price),
        isbn: isbn,
        users: {
          connect: authorsIds,
        }
      }
    });

    if (updatedBook) {
      res.status(200).json({message: "Successfully updated book"});
    } else {
      res.status(500).json({error: "There was an issue updating the book"});
    };

  } catch(error) {
    console.error("Server error at the update book route:", error);
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
      contactName,
      contactPhone,
      contactEmail } = req.body;
    const new_bookstore =  await prisma.bookstore.create({
      data: {
        name: name,
        deal_percentage: parseFloat(dealPercentage),
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
      contactName,
      contactPhone,
      contactEmail } = req.body;
    const updatedBookstore = await prisma.bookstore.update({
      where: {id: id},
      data: {
        name: name,
        deal_percentage: parseFloat(dealPercentage),
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
      }
    });

    console.log(updatedBookstore);
    if (updatedBookstore) {
      res.status(200).json({message: "Successfully updated bookstore"});
    } else {
      res.status(500).json({error: "There was an issue updating the bookstore"});
    };

  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
  }
});

router.delete('/bookstore', async (req, res) => {
  const bookstore_id = parseInt(req.query.bookstore_id);

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
        initial: true,
        current: true
      },
      orderBy: {
        book: {
          title: 'asc'
        }
      }
    });

    // await redisClient.set("authorsList", JSON.stringify(users));

    res.json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventories route"});
  }
});

router.post('/inventory', async (req, res) => {
  try {
    const {
      book,
      bookstore,
      country,
      inicial
    } = req.body;
    const existing = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId_country: {
          bookId: book,
          bookstoreId: bookstore,
          country: country
        }
      }
    });

    if (existing) {
      if (existing.isDeleted === false) {
        res.status(500).json({message: "Este inventario ya existe"})
        return;
      }

      const exhumedInventory = await prisma.inventory.update({
        where: {id: existing.id},
        data: {
          bookId: book,
          bookstoreId: bookstore,
          country: country,
          initial: inicial,
          current: inicial,
          isDeleted: false
        }
      });
      res.status(201).json(exhumedInventory);
      return;
    }

    const createdInventory = await prisma.inventory.create({
      data: {
        bookId: book,
        bookstoreId: bookstore,
        country: country,
        initial: inicial,
        current: inicial
      }
    });
    res.status(201).json(createdInventory);
  } catch (error) {
    console.error(error);
    if (String(error).includes(("Unique constraint failed on the fields: (`bookId`,`bookstoreId`,`country`)"))) {
      res.status(500).json({message: "Este inventario ya existe"})
      return;
    }

    res.status(500).json({ error: error });
  }
})

router.patch('/inventory', async (req, res) => {
  try {
    const {
      id,
      book,
      bookstore,
      country,
      inicial
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
        initial: inicial
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

    console.log(updatedInventory);
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

router.delete('/inventory', async (req, res) => {
  const inventory_id = parseInt(req.query.inventory_id);

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
                price: true
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
      }
    });

    if (createdSale) {
      const updatedInventory = await prisma.inventory.update({
        where: {id: selectedInventory.id},
        data: {
          current: selectedInventory.current-quantity
        }
      });
      console.log(updatedInventory);
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

    if (selectedInventory.current < quantity) {
      res.status(400).json({ message: "El inventario tiene menos libros que la cantidad entrada."});
      return;
    }

    const previousSale = await prisma.sale.findUnique({where: {id: id}});
    let quantityUpdate = previousSale.quantity - quantity;

    const updatedSale = await prisma.sale.update({
      where: {id: id},
      data: {
        inventoryId: selectedInventory.id,
        quantity: quantity
      }
    });

    if (updatedSale) {
      const updatedInventory = await prisma.inventory.update({
        where: {id: selectedInventory.id},
        data: {
          current: selectedInventory.current + quantityUpdate
        }
      });
      console.log(updatedInventory);
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

router.delete('/sale', async (req, res) => {
  const sale_id = parseInt(req.query.sale_id);
  const inventory_id = parseInt(req.query.inventory_id);
  const quantity = parseInt(req.query.quantity);
  try {
    const deletedSale = await prisma.sale.update({where:
      {id: sale_id},
      data: {
        isDeleted: true
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
      console.log(updatedInventory);
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

    const createdImpression = await prisma.impression.create({
      data: {
        bookId: id,
        quantity: quantity
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

router.delete('/impression', async (req, res) => {
  try {
    const impression_id = parseInt(req.query.impression_id);
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

async function softDeleteSalesOnCascade(IdsList) {
  let salesToDelete = [];

  for (const id of IdsList) {
    const relatedSales = await prisma.sale.findMany({
      where: {inventoryId: id},
      select: {
        id : true
      }
    });
    for (const sale of relatedSales) {
      salesToDelete.push(sale.id);
    }
  }

  await Promise.all(
    salesToDelete.map(async (saleId) => {
      await prisma.sale.update({
        where: {id: saleId},
        data: { isDeleted: true}
      })
    })
  );
}

export default router;
