import { Role } from "@prisma/client";
import express from "express";
import bcrypt from 'bcrypt';
import { sendSetPasswordMail } from './../mailer.js';
import { createRandomPassword, calculateAuthorRevenue, getForMonth } from './../utils.js';
import { prisma } from "../prisma/client.js"

const router = express.Router();

// User routes

router.get('/users', async (req, res) => {
  try {
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
        birthday: true,
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
      phone,
      birthday,
      category } = req.body;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
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

        const exhumedUser = await tx.user.update({
          where: {id: existing.id},
          data: {
            first_name: firstName,
            last_name: lastName,
            country: country,
            referido: referido,
            email: email,
            phone: phone,
            birthday: birthday,
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

      const new_author =  await tx.user.create({
        data: {
          first_name: firstName,
          last_name: lastName,
          country: country,
          referido: referido,
          email: email,
          phone: phone,
          birthday: birthday,
          password: hashedPassword,
          categoryId: parseInt(category)
        },
      });

      res.status(201).json({
        firstName: new_author.first_name,
        lastName: new_author.last_name,
        email: new_author.email});
      sendSetPasswordMail(email, firstName, password);
    })

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
      phone,
      birthday,
      categoryId } = req.body;

    await prisma.$transaction(async (tx) => {
      // const authorBeforeUpdate = await tx.user.findUnique({
      //   where: {
      //     id: id
      //   },
      //   include: {
      //     category: true
      //   }
      // });

      const updatedAuthor = await tx.user.update({
        where: {id: parseInt(id)},
        data: {
          first_name: first_name,
          last_name: last_name,
          country: country,
          referido: referido,
          email: email,
          phone: phone,
          birthday: birthday,
          category: {
            connect: {
              id: parseInt(categoryId)
            }
          }
        },
        include: {
          category: true
        }
      });

      // if (updatedAuthor && authorBeforeUpdate.categoryId !== updatedAuthor.categoryId ) {
      //   let impactedSales = [];
      //   const impactedBooks = await tx.book.findMany({
      //     where: {
      //       isDeleted: false,
      //       users: {
      //         some: {
      //           id: updatedAuthor.id
      //         }
      //       }
      //     },
      //     include: {
      //       users: true
      //     }
      //   });

      //   for (const book of impactedBooks) {
      //     const numberOfAuthors = book.users.length
      //     const impactedInventories = await tx.inventory.findMany({
      //       where: {
      //         isDeleted: false,
      //         bookId: book.id
      //       },
      //       include: {
      //         bookstore: true
      //       }
      //     });

      //     for (const inventory of impactedInventories) {
      //       const impactedSalesForInventory = await tx.sale.findMany({
      //         where: {
      //           isDeleted: false,
      //           inventoryId: inventory.id
      //         }
      //       });

      //       for (const sale of impactedSalesForInventory) {
      //         impactedSales.push({
      //           ...sale,
      //           "userId": updatedAuthor.id,
      //           "comissions": inventory.bookstore.comissions,
      //           "price": inventory.price,
      //           "management_min": updatedAuthor.category.management_min,
      //           "percentage_management_stores": updatedAuthor.category.percentage_management_stores,
      //           "percentage_royalties": updatedAuthor.category.percentage_royalties,
      //           "numberOfAuthors": numberOfAuthors
      //         })
      //       }
      //     }
      //   }

      //   for (const sale of impactedSales) {
      //     const saleForMonth = getForMonth(sale.createdAt)
      //     const previousPayment = await tx.payment.findUnique({
      //       where: {
      //         userId_forMonth: {
      //           userId: sale.userId,
      //           forMonth: saleForMonth
      //         }
      //       }
      //     })

      //     const previousSaleValue = calculateAuthorRevenue(
      //       sale.comissions,
      //       sale.price,
      //       authorBeforeUpdate.category.management_min,
      //       authorBeforeUpdate.category.percentage_management_stores,
      //       sale.quantity,
      //     )

      //     const newSaleValue = calculateAuthorRevenue(
      //       sale.comissions,
      //       sale.price,
      //       sale.management_min,
      //       sale.percentage_management_stores,
      //       sale.quantity,
      //     )

      //     const quantityUpdate = newSaleValue - previousSaleValue

      //     if (previousPayment && previousPayment.status !== "paid") {
      //       const updatedPayment = await tx.payment.update({
      //         where: {
      //           id: previousPayment.id
      //         },
      //         data: {
      //           amount: previousPayment.amount + quantityUpdate
      //         }
      //       })
      //     }
      //   }
      // }

      if (updatedAuthor) {
        res.status(200).json({message: "Successfully updated user"});
      } else {
        res.status(500).json({error: "There was an issue updating the author"});
      };
    })

  } catch(error) {
    console.error("Server error at the update user route:", error);
    res.status(500).json({error: "There was an issue updating the author"});
  } 
})

router.delete('/user/:id', async (req, res) => {
  const user_id = parseInt(req.params.id);

  try {
    await prisma.$transaction(async (tx) => {
      const deletedAuthor = await tx.user.update({
        where: {id: user_id},
        data: {isDeleted: true}
      });

      if (deletedAuthor) {
        const deletedBooksIds = await softDeleteBooksOnCascade(deletedAuthor, tx);
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade(deletedBooksIds, "books", tx);
        await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
        const deletedPayments = await softDeletePaymentsOnCascade(deletedAuthor, tx);
        for (const payment of deletedPayments) {
          await softDeleteCostsOnCascade(payment, tx);
        }
      };
    })

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

router.get('/categoryImpactedUsers/:id', async (req, res) => {
  const category_id = parseInt(req.params.id);
  try {
    const impactedUsers = await prisma.user.findMany({
        where: {
          categoryId: category_id
        }
      });

    res.status(200).json({"numImpactedUsers": impactedUsers.length});
  } catch(error) {
    console.error("Error while checking impaced users:", error);
    res.status(500).json({error: "A server error occurred while checking impacted users"});
  }
})

router.delete('/category/:id', async (req, res) => {
  const category_id = parseInt(req.params.id);
  const selectedCategory = parseInt(req.body.selectedCategory);

  try {
    await prisma.$transaction(async (tx) => {
      if (selectedCategory !== 0) {
        const impactedUsers = await tx.user.findMany({
          where: {
            categoryId: category_id
          }
        });

        for (const user of impactedUsers) {
          await tx.user.update({
            where: {
              id: user.id
            },
            data: {
              categoryId: selectedCategory
            }
          })
        };
      };

      const deletedCategory = await tx.category.update({
        where: {id: category_id},
        data: {isDeleted: true}
      });

      if (deletedCategory) {
        const authorsToUpdate = await tx.user.findMany({
          where: {
            isDeleted: false,
            categoryId: category_id,
          }
        });

        await Promise.all(
          authorsToUpdate.map(async (author) => {
            await tx.user.update({
              where: {id: author.id},
              data: {categoryId: null}
            })
          })
        );
      };
    })
    
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

    await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: {
          type: tipo
        }
      });

      if (existing) {
        if (existing.isDeleted === false) {
          res.status(500).json({message: "Esta categoria ya existe"})
          return;
        }

        const exhumedUser = await tx.user.update({
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

      const new_category =  await tx.category.create({
        data: {
          type: tipo,
          percentage_royalties: parseFloat(regalias),
          percentage_management_stores: parseFloat(gestionTiendas),
          management_min: parseFloat(gestionMinima),
        },
      });

      res.status(201).json({name: new_category.type});
    })
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

    await prisma.$transaction(async (tx) => {
      const previousCategory = await tx.category.findUnique({
        where: {id: id}
      });
      const updatedCategory = await tx.category.update({
        where: {id: id},
        data: {
          type: tipo,
          percentage_royalties: parseInt(regalias),
          percentage_management_stores: parseInt(gestionTiendas),
          management_min: parseInt(gestionMinima),
        }
      });

      // await updatePaymentsOnCascade(updatedCategory, previousCategory, tx);

      if (updatedCategory) {
        res.status(200).json({message: "Successfully updated category"});
      } else {
        res.status(500).json({error: "There was an issue updating the category"});
      };
    })

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
        },
        inventories: {
          select: {
            id: true,
            bookstore: {
              select: {
                name: true
              },
            },
            bookstoreId: true,
            price: true
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
        for (const inv of book.inventories) {
          if (inv.bookstoreId === 3) {
            book.price = inv.price
          }
        }

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
    
    await prisma.$transaction(async (tx) => {
      const new_book = await tx.book.create({
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
        new_impression = await tx.impression.create({
          data: {
            bookId: new_book.id,
            quantity: quantity,
          }
        })
      };

      let new_inventory;
      if (new_impression) {
        new_inventory = await tx.inventory.create({
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
    })

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
    await prisma.$transaction(async (tx) => {
      const deletedBook = await tx.book.update({where:
        {id: book_id},
        data: {
          isDeleted: true
        }
      });

      if (deletedBook) {
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade([book_id], "books", tx);
        await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
        await softDeleteImpressionsOnCascade(deletedBook, tx);
      }

      res.status(200).json({message: "El libro ha sido eliminado con exito."})
    })
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

    await prisma.$transaction(async (tx) => {
      const previousBook = await tx.book.findUnique({
        where: {id: id},
        select: {
          users: {
            select: {
              id: true
            }
          }
        }
      });

      // let previousNumberOfAuthors = 0
      // if (previousBook) {
      //   previousNumberOfAuthors = previousBook.users.length;
      // }

      const updatedBook = await tx.book.update({
        where: {id: id},
        data: {
          title: title,
          pasta: pasta,
          isbn: isbn,
          users: {
            set: authorsIds,
          }
        }
      });

      // if (previousNumberOfAuthors !== authorsIds.length) {
      //   const impactedInventories = await tx.inventory.findMany({
      //     where: {
      //       bookId: id,
      //       isDeleted: false
      //     },
      //     select: {
      //       sales: {
      //         select: {
      //           id: true,
      //           createdAt: true,
      //           quantity: true
      //         }
      //       },
      //       bookstore: {
      //         select: {
      //           comissions: true
      //         }
      //       },
      //       price: true
      //     }
      //   });

      //   for (const inventory of impactedInventories) {
      //     for (const sale of inventory.sales) {
      //       const date = new Date(sale.createdAt);
      //       const year = String(date.getFullYear());
      //       const month = String(date.getMonth() + 1).padStart(2, '0');
      //       const saleForMonth = year + "-" + month

      //       for (const authorId of authorsIds) {
      //         const author = await tx.user.findUnique({
      //           where: {
      //             id: authorId.id
      //           },
      //           select: {
      //             category: {
      //               select: {
      //                 percentage_management_stores: true,
      //                 percentage_royalties: true,
      //                 management_min: true
      //               }
      //             },
      //             first_name: true
      //           }
      //         });

      //         const previousPayment = await tx.payment.findUnique({
      //           where: {
      //             userId_forMonth: {
      //               userId: authorId.id,
      //               forMonth: saleForMonth
      //             }
      //           }
      //         });

      //         if (previousPayment && previousPayment.status !== "paid") {
      //           const previousSaleValue = calculateAuthorRevenue(
      //             inventory.bookstore.comissions,
      //             inventory.price,
      //             author.category.management_min,
      //             author.category.percentage_management_stores,
      //             sale.quantity,
      //           );

      //           const newSaleValue = calculateAuthorRevenue(
      //             inventory.bookstore.comissions,
      //             inventory.price,
      //             author.category.management_min,
      //             author.category.percentage_management_stores,
      //             sale.quantity,
      //           );

      //           const quantityUpdate = newSaleValue - previousSaleValue

      //           const updatedPayment = await tx.payment.update({
      //             where: {
      //               id: previousPayment.id
      //             },
      //             data: {
      //               amount: previousPayment.amount + quantityUpdate
      //             }
      //           })
      //         }
      //       }
      //     }
      //   }
      // }

      if (updatedBook) {
        res.status(200).json({message: "Successfully updated book"});
      } else {
        res.status(500).json({error: "There was an issue updating the book"});
      };
    })
    

  } catch(error) {
    console.error("Server error at the update book route:", error);
    res.status(500).json({error: "There was an issue updating the book"});
  }
});

router.patch('/book/:id/prices', async (req, res) => {
  const {
    id,
    prices
  } = req.body

  try {
    await prisma.$transaction(async (tx) => {
      for (const price of prices) {
        // const previousInventory = await tx.inventory.findUnique({
        //   where: {
        //     id: price.inventoryId
        //   },
        //   include: {
        //     bookstore: true
        //   }
        // });

        const updatedInventory = await tx.inventory.update({
          where: {id: parseInt(price.inventoryId)},
          data: {price: parseFloat(price.price)},
          include: {
            bookstore: true
          }
        })

        // const concernedSalesWithPayments = await tx.sale.findMany({
        //   where: {
        //     inventoryId: updatedInventory.id,
        //     isDeleted: false
        //   },
        //   include: {
        //     payments: true
        //   }
        // });

        // for (const sale of concernedSalesWithPayments) {
        //   for (const payment of sale.payments) {
        //     if (payment.isDeleted === false) {
        //       const userWithCategory = await tx.user.findUnique({
        //         where: {
        //           id: payment.userId
        //         },
        //         include: {
        //           category: true
        //         }
        //       })

        //       const previousSaleValue = calculateAuthorRevenue(
        //         previousInventory.bookstore.comissions,
        //         previousInventory.price,
        //         userWithCategory.category.management_min,
        //         previousInventory.bookstore.deal_percentage,
        //         sale.quantity
        //       )

        //       const newSaleValue = calculateAuthorRevenue(
        //         updatedInventory.bookstore.comissions,
        //         updatedInventory.price,
        //         userWithCategory.category.management_min,
        //         updatedInventory.bookstore.deal_percentage,
        //         sale.quantity
        //       )

        //       const updatedPayment = await tx.payment.update({
        //         where: {
        //           id: payment.id
        //         },
        //         data: {
        //           amount: payment.amount - previousSaleValue + newSaleValue
        //         }
        //       })
        //     }
        //   }
        // }

      }
      res.status(200).json({message: "Successfully updated the book prices"});
    })
  } catch (error) {
    console.error("Server error at the update book route:", error);
    res.status(500).json({error: "There was an issue updating the prices"});
  }
})

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

    await prisma.$transaction(async (tx) => {
      const updatedBookstore = await tx.bookstore.update({
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

      // await updatePaymentsOnCascadeFromBookstore(updatedBookstore, tx);

      res.status(200).json({message: "Successfully updated bookstore"});
    })
  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
    res.status(500).json({error: "There was an issue updating the bookstore"});
  }
});

router.delete('/bookstore/:id', async (req, res) => {
  const bookstore_id = parseInt(req.params.id);

  try {
    await prisma.$transaction(async (tx) => {
      const deletedBookstore = await tx.bookstore.update({where:
        {id: bookstore_id},
        data: {
          isDeleted: true
        }
      });

      if (deletedBookstore) {
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade([bookstore_id], "bookstores", tx);
        await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
      }

      res.status(200).json({message: "La libreria ha sido eliminada con exito."})
    })

  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the bookstore'});
  }
})

/// Inventories routes

router.get('/inventories', async (req, res) => {
  try {
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

    res.json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventories route"});
  }
});

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

router.get('/inventoriesByBook', async (req, res) => {
  try {
    const inventories = await prisma.inventory.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        book: {
          select: {
            title: true,
            impressions: {
              select: {
                id: true,
                quantity: true,
                isDeleted: true
              }
            }
          }
        },
        bookId: true,
        bookstore: {
          select: {
            name: true,
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
    });

    let inventoriesByBook = []
    let extraImpressionsByBook = [];
    for (const inventory of inventories) {
      let sold = 0;

      //Prepping extraImpressions data
      function determineExtraImpressions(extraImpressionsByBook) {
        let extraImpressionsTotal = 0;
        let extraImpressions = inventory.book.impressions.slice(1)
        if (extraImpressions.length > 0) {
          for (const impression of extraImpressions) {
            extraImpressionsTotal += impression.quantity
          }
        }

        extraImpressionsByBook.push({
          "name": inventory.book.title,
          "extraImpressions": extraImpressionsTotal
        })
      }

      if (extraImpressionsByBook.length === 0) {
        determineExtraImpressions(extraImpressionsByBook)
      }

      for (const entry of extraImpressionsByBook) {
        if (entry.name === inventory.book.title) {
          continue;
        }
      } 

      determineExtraImpressions(extraImpressionsByBook);
      
      for (const sale of inventory.sales) {
        if (sale.isDeleted === false) {
          sold += sale.quantity
        }
      }

      if (inventoriesByBook.length === 0) {
        inventoriesByBook.push({
          "id": inventory.bookId,
          "type": "book",
          "name": inventory.book.title,
          "initial": inventory.initial,
          "sold": sold,
          "current": inventory.current,
          "returns": inventory.returns,
          "givenToAuthor": inventory.givenToAuthor
        })
      };

      let existingBook = false
      for (const bookInventory of inventoriesByBook) {
        if (bookInventory.name === inventory.book.title) {
          bookInventory.initial += inventory.initial
          bookInventory.sold += sold
          bookInventory.current += inventory.current
          bookInventory.returns += inventory.returns
          bookInventory.givenToAuthor += inventory.givenToAuthor
          existingBook = true
        }
      }

      if (!existingBook) {
        inventoriesByBook.push({
          "id": inventory.bookId,
          "type": "book",
          "name": inventory.book.title,
          "initial": inventory.initial,
          "sold": sold,
          "current": inventory.current,
          "returns": inventory.returns,
          "givenToAuthor": inventory.givenToAuthor
        })
      }
    }

    //Adding the extraImpression data for each book 
    for (const impression of extraImpressionsByBook) {
      for (const book of inventoriesByBook) {
        if (impression.name === book.name) {
          book.extraImpressions = impression.extraImpressions
        }
      }
    }

    res.status(200).json(inventoriesByBook);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error fetching inventories route"});
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
    let name = thatBookInventories[0].book.title
    let id = queryBookId;
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
      name,
      id,
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

router.get('/inventoriesByBookstore', async (req, res) => {
  try {
    const inventories = await prisma.inventory.findMany({
      where: {
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
            name: true,
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
    });

    let inventoriesByBookstore = []
    for (const inventory of inventories) {
      let sold = 0;
      for (const sale of inventory.sales) {
        if (sale.isDeleted === false) {
          sold += sale.quantity
        }
      }

      if (inventoriesByBookstore.length === 0) {
        inventoriesByBookstore.push({
          "id": inventory.bookstoreId,
          "type": "bookstore",
          "name": inventory.bookstore.name,
          "initial": inventory.initial,
          "sold": sold,
          "current": inventory.current,
          "returns": inventory.returns,
          "givenToAuthor": inventory.givenToAuthor
        })
      };

      let existingBookstore = false
      for (const bookstoreInventory of inventoriesByBookstore) {
        if (bookstoreInventory.name === inventory.bookstore.name) {
          bookstoreInventory.initial += inventory.initial
          bookstoreInventory.sold += sold
          bookstoreInventory.current += inventory.current
          bookstoreInventory.returns += inventory.returns
          bookstoreInventory.givenToAuthor += inventory.givenToAuthor
          existingBookstore = true
        }
      }

      if (!existingBookstore) {
        inventoriesByBookstore.push({
          "id": inventory.bookstoreId,
          "type": "bookstore",
          "name": inventory.bookstore.name,
          "initial": inventory.initial,
          "sold": sold,
          "current": inventory.current,
          "returns": inventory.returns,
          "givenToAuthor": inventory.givenToAuthor
        })
      }
    }

    res.status(200).json(inventoriesByBookstore);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error fetching inventories route"});
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
            title: true,
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
    let name = thatBookstoreInventories[0].bookstore.name;
    let extraImpressionsTotal = 0;
    let id = queryBookstoreId;
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

      //Impressions for Plataforma Was inventory
      let extraImpressionsOutside = 0;
      if (queryBookstoreId === 3) {
        const thatBookImpressions = await prisma.impression.findMany({
          where: {
            bookId: inventory.bookId,
            isDeleted: false
          },
          select: {
            id: true,
            quantity: true
          },
          orderBy: {
            createdAt: "asc"
          }
        })

        if (thatBookImpressions.length > 1) {
          let extraImpressions = thatBookImpressions.slice(1)
          for (const impression of extraImpressions) {
            extraImpressionsOutside += impression.quantity
            extraImpressionsTotal += impression.quantity
          }
        }
      }
      console.log("");
      console.log("extraImpressionsOutside", extraImpressionsOutside)
      console.log("extraImpressionsTotal", extraImpressionsTotal)
      const inventoryPlusSales = {
        ...inventory, 
        totalSales: thisInventorySalesTotal,
        extraImpressions: extraImpressionsOutside
      }
      console.log("inventoryPlusSales", inventoryPlusSales)
      relevantInventories.push(inventoryPlusSales);
    }
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    const payload = {
      name,
      id,
      sortedRelevantInventories,
      currentTotal,
      initialTotal,
      returnsTotal,
      givenToAuthorTotal,
      soldTotal,
      extraImpressionsTotal
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
      // country,
      inicial,
      price
    } = req.body;

    await prisma.$transaction(async (tx) => {
      const currentInventory = await tx.inventory.findUnique({
        where: {id: id}
      });
      const difference = inicial - currentInventory.initial
      let updatedInventory = await tx.inventory.update({
        where: {id: id},
        data: {
          bookId: book,
          bookstoreId: bookstore,
          // country: country,
          initial: inicial,
          price: price
        }
      });
      if (updatedInventory.current > updatedInventory.initial) {
        updatedInventory = await tx.inventory.update({
          where: {id: id},
          data: {current: updatedInventory.initial}
        })
      } else {
        updatedInventory = await tx.inventory.update({
          where: {id: id},
          data: {current: updatedInventory.current + difference}
        })
      }

      // await updatePaymentsOnCascadeFromInventory(updatedInventory, currentInventory.price, tx);

      if (updatedInventory) {
        res.status(200).json({message: "Successfully updated inventory"});
      } else {
        if (String(error).includes(("Unique constraint failed on the fields: (`bookId`,`bookstoreId`)"))) {
          res.status(500).json({message: "Este inventario ya existe"})
          return;
        }
        res.status(500).json({error: "There was an issue updating the bookstore"});
      };
    })
  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
    res.status(500).json({error: "There was an issue updating the bookstore"});
  }
});

router.delete('/inventory/:id', async (req, res) => {
  const inventory_id = parseInt(req.params.id);

  try {

    await prisma.$transaction(async (tx) => {
      const deletedInventory = await tx.inventory.update({
        where:{id: inventory_id},
        data: {isDeleted: true}
      });

      if (deletedInventory) {
        await softDeleteSalesOnCascade([inventory_id], tx);
      }

      res.status(200).json({message: "El inventario ha sido eliminado con exito."})
    })
    
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the inventory'});
  }
})

/// Sales routes

router.get('/sales', async (req, res) => {
  try {
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

    sales.map((sale) => {
      sale.completeInventory = sale.inventory.book.title + ", " + sale.inventory.bookstore.name
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
      // country,
      quantity
    } = req.body;

    let createdSale;
    await prisma.$transaction(async (tx) => {
      const selectedInventory = await tx.inventory.findUnique({
        where : {
          bookId_bookstoreId: {
            bookId : book,
            bookstoreId: bookstore,
            // country: country
          }
        },
        include: {
          bookstore: true,
          book: true
        }
      });

      if (!selectedInventory) {
        res.status(400).json({ message: "No existe un inventario con esta combinación de titulo, librería y país"});
        return;
      }

      if (selectedInventory.current < quantity) {
        res.status(400).json(
          { message: "El inventario tiene menos libros disponibles que la cantidad entrada."}
        );
        return;
      }

      const bookWithUsers = await tx.book.findUnique({
        where: {
          id: book
        },
        include: {
          users: true
        }
      })

      const authorListIds = bookWithUsers.users.map(user => user.id);
      const saleForMonth = getForMonth(new Date())
      let paymentIds = []
      for (const authorId of authorListIds) {
        // const userWithCategory = await tx.user.findUnique({
        //   where: {
        //     id: authorId
        //   },
        //   include: {
        //     category: true
        //   }
        // });

        const existingPayment = await tx.payment.findUnique({
          where: {
            userId_forMonth: {
              userId: authorId,
              forMonth: saleForMonth
            }
          }
        })

        if (!existingPayment) {
          const createdPayment = await tx.payment.create({
            data: {
              userId: authorId,
              forMonth: saleForMonth,
              // amount: calculateAuthorRevenue(
              //   selectedInventory.bookstore.comissions,
              //   selectedInventory.price,
              //   userWithCategory.category.management_min,
              //   selectedInventory.bookstore.deal_percentage,
              //   quantity
              // )
            }
          });

          paymentIds.push({"id": createdPayment.id})
        }
        //   } else {
        //     const updatedPayment = await tx.payment.update({
        //       where: {
        //         id: existingPayment.id
        //       },
        //       data: {
        //         amount: existingPayment.amount + calculateAuthorRevenue(
        //           selectedInventory.bookstore.comissions,
        //           selectedInventory.price,
        //           userWithCategory.category.management_min,
        //           selectedInventory.bookstore.deal_percentage,
        //           quantity
        //         )
        //       }
        //     });
        //     paymentIds.push({"id": updatedPayment.id})
        //   }
        // }
      }

      createdSale = await tx.sale.create({
        data: {
          inventoryId: selectedInventory.id,
          quantity: quantity,
          payments: {
            connect: paymentIds
          }
        }
      })

      if (createdSale) {
        const updatedInventory = await tx.inventory.update({
          where: {id: selectedInventory.id},
          data: {
            current: selectedInventory.current-quantity
          }
        });
      }
    })
    
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
      // country,
      quantity
    } = req.body;

    await prisma.$transaction(async (tx) => {
      const selectedInventory = await tx.inventory.findUnique({where : {
        bookId_bookstoreId: {
          bookId : book,
          bookstoreId: bookstore,
          // country: country
        }}});

      if (!selectedInventory) {
        res.status(400).json({ message: "No existe un inventario con esta combinación de titulo, librería y país"});
        return;
      }

      const previousSale = await tx.sale.findUnique({where: {id: id}});

      let quantityUpdate = previousSale.quantity - quantity;

      if ((selectedInventory.current + quantityUpdate) < 0) {
        res.status(400).json({ message: "El inventario tiene menos libros que la cantidad entrada."});
        return;
      }

      const updatedSale = await tx.sale.update({
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

      if (updatedSale) {
        const updatedInventory = await tx.inventory.update({
          where: {id: selectedInventory.id},
          data: {
            current: selectedInventory.current + quantityUpdate
          }
        });
      

        // // update all potential authors payments sums as well
        // const date = new Date(updatedSale.createdAt);
        // const year = String(date.getFullYear());
        // const month = String(date.getMonth() + 1).padStart(2, '0');
        // const currentForMonth = year + "-" + month

        // const bookOfSale = await tx.book.findUnique({
        //   where: {
        //     id: updatedInventory.bookId
        //   },
        //   select: {
        //     users: {
        //       select: {
        //         id: true
        //       }
        //     }
        //   }
        // })
        // const userIds = bookOfSale.users.map(user => user.id);

        // // update the payment for each author of the book
        // if (userIds.length > 0) {
        //   for (const id of userIds) {
        //     // using findMany instead of findUnique here to avoid the error if not found.
        //     const relatedPayment = await tx.payment.findUnique({
        //       where: {
        //         userId_forMonth: {
        //           userId: id,
        //           forMonth: currentForMonth,
        //         },
        //         isDeleted: false
        //       }
        //     })

        //     const userCategory = await tx.user.findUnique({
        //       where: {
        //         id: id,
        //         isDeleted: false
        //       },
        //       select: {
        //         category: {
        //           select: {
        //             percentage_royalties: true,
        //             percentage_management_stores: true,
        //             management_min: true
        //           }
        //         }
        //       }
        //     })

        //     const previousSaleAmount = calculateAuthorRevenue(
        //       updatedSale.inventory.bookstore.comissions,
        //       updatedSale.inventory.price,
        //       userCategory.category.management_min,
        //       userCategory.category.percentage_management_stores,
        //       previousSale.quantity,
        //     )

        //     const saleAmount = calculateAuthorRevenue(
        //       updatedSale.inventory.bookstore.comissions,
        //       updatedSale.inventory.price,
        //       userCategory.category.management_min,
        //       userCategory.category.percentage_management_stores,
        //       quantityUpdate,
        //     )

        //     if (!relatedPayment) {
        //       const createdPayment = await tx.payment.create({
        //         data: {
        //           userId: id,
        //           amount: paymentAmount,
        //           forMonth: currentForMonth
        //         }
        //       })
        //     } else {
        //       const updatedRelatedPayment = await tx.payment.update({
        //         where: {
        //           id: relatedPayment.id
        //         },
        //         data: {
        //           amount: relatedPayment.amount - previousSaleAmount + saleAmount
        //         }
        //       })
        //     }
        //   }
        // }

        res.status(200).json({message: "Successfully updated sale"});
      } else {
        if (String(error).includes(("Unique constraint failed on the fields: (`bookId`,`bookstoreId`)"))) {
          res.status(500).json({message: "Este inventario ya existe"})
          return;
        }
        res.status(500).json({error: "There was an issue updating the sale"});
      };
    })

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
    await prisma.$transaction(async (tx) =>  {
      const deletedSale = await tx.sale.update({where:
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
        const selectedInventory = await tx.inventory.findUnique({where: {id: inventory_id}});
        const updatedInventory = await tx.inventory.update({
          where: {id: inventory_id},
          data: {
            current: selectedInventory.current + quantity
          }
        });

        // // update all potential authors payments sums as well
        // const date = new Date(deletedSale.createdAt);
        // const year = String(date.getFullYear());
        // const month = String(date.getMonth() + 1).padStart(2, '0');
        // const currentForMonth = year + "-" + month

        // const bookOfSale = await tx.book.findUnique({
        //   where: {
        //     id: updatedInventory.bookId
        //   },
        //   select: {
        //     users: {
        //       select: {
        //         id: true
        //       }
        //     }
        //   }
        // })
        // const userIds = bookOfSale.users.map(user => user.id);

        // // update the payment for each author of the book
        // if (userIds.length > 0) {
        //   for (const id of userIds) {
        //     // using findMany instead of findUnique here to avoid the error if not found.
        //     const relatedPayment = await tx.payment.findMany({
        //       where: {
        //         userId: id,
        //         forMonth: currentForMonth,
        //         isDeleted: false
        //       }
        //     })

        //     const userCategory = await tx.user.findUnique({
        //       where: {
        //         id: id,
        //         isDeleted: false
        //       },
        //       select: {
        //         category: {
        //           select: {
        //             percentage_royalties: true,
        //             percentage_management_stores: true,
        //             management_min: true
        //           }
        //         }
        //       }
        //     })

        //     const saleValue = calculateAuthorRevenue(
        //       deletedSale.inventory.bookstore.comissions,
        //       deletedSale.inventory.price,
        //       userCategory.category.management_min,
        //       userCategory.category.percentage_management_stores,
        //       quantity,
        //     )

        //     const updatedRelatedPayment = await tx.payment.update({
        //       where: {
        //         id: relatedPayment[0].id
        //       },
        //       data: {
        //         amount: relatedPayment[0].amount - saleValue
        //       }
        //     })
        //   }
        // }
      }
    })
    
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

    await prisma.$transaction(async (tx) => {
      const createdImpression = await tx.impression.create({
        data: {
          bookId: id,
          quantity: quantity,
          note: note
        }
      })

      const wasInventory = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: id,
            bookstoreId: 3,
          }
        }
      });

      if (wasInventory && !wasInventory.isDeleted) {
        const updatedInventory = await tx.inventory.update({
          where: {id: wasInventory.id},
          data: {
            current: wasInventory.current + quantity,
            // initial: wasInventory.initial + quantity
          }
        })
      };

    res.status(201).json(createdImpression);
    })

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

    await prisma.$transaction(async (tx) => {
      const updatedImpression = await tx.impression.update({
        where: {id: impression_id},
        data: {
          isDeleted: true
        }
      })

      const wasInventory = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: book_id,
            bookstoreId: 3
          }
        }
      });

      if (wasInventory && !wasInventory.isDeleted) {
        const updatedInventory = await tx.inventory.update({
          where: {id: wasInventory.id},
          data: {
            current: wasInventory.current - quantity,
            initial: wasInventory.initial - quantity
          }
        })
      }

    res.status(200).json(updatedImpression);
    })
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

    await prisma.$transaction(async (tx) => {
      const currentImpression = await tx.impression.findUnique({ where: {id: id}});
      const diff = parseInt(quantity) - currentImpression.quantity;

      const updatedImpression = await tx.impression.update({
        where: {id: id},
        data: {
          quantity: parseInt(quantity)
        }
      });

      const wasInventory = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: book_id,
            bookstoreId: 3
          }
        }
      });

      if (wasInventory && !wasInventory.isDeleted) {
        const updatedInventory = await tx.inventory.update({
          where: {id: wasInventory.id},
          data: {
            current: wasInventory.current + diff,
            initial: wasInventory.initial + diff
          }
        })
      }

      res.status(200).json(updatedImpression);
    })
    
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
      // country
    } = req.body;

    const dateInDateTime = new Date(deliveryDate);

    // Start by getting the inventoryFrom
    await prisma.$transaction(async (tx) => {
      const currentInventoryFrom = await tx.inventory.findUnique({
        where: {
          id: parseInt(inventoryFromId),
          isDeleted: false
        }
      });

      // Route 1 : delivered to Author
      if (type === "send" && !bookstoreToId) {

        // if (country !== "México") {
        //   res.status(400).json({message: "Una entrega al autor debe estar hecho desde el inventario de Was del libro en Mexico"})
        //   return;
        // }

        const newTransferToAuthor = await tx.transfer.create({
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
          const updatedFromInventory = await tx.inventory.update({
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
      let currentInventoryTo = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: parseInt(bookId),
            bookstoreId: parseInt(bookstoreToId)
          },
          isDeleted: false
        }
      });

      let newInventoryTo;
      let recoveredInventoryTo;

      // if it doesnt exist check if it isn't soft deleted. 1/ Get it if deleted
      if (!currentInventoryTo) {
        const deletedInventoryMaybe = await tx.inventory.findUnique({
          where: {
            bookId_bookstoreId: {
              bookId: parseInt(bookId),
              bookstoreId: parseInt(bookstoreToId),
            },
            isDeleted: true
          }
        });

        // 2/ If it is not, create it.
        if (!deletedInventoryMaybe) {
          newInventoryTo = await tx.inventory.create({
            data: {
              bookId: parseInt(bookId),
              bookstoreId: parseInt(bookstoreToId),
              initial: parseInt(quantity),
              current: parseInt(quantity)
            }
          });
        // 3/ Otherwise recover it
        } else {
          recoveredInventoryTo = await tx.inventory.update({
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
      const newTransfer = await tx.transfer.create({
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
          const updatedInventoryFrom = await tx.inventory.update({
            where: {id: parseInt(inventoryFromId)},
            data: {
              current: currentInventoryFrom.current - parseInt(quantity),
              initial: currentInventoryFrom.initial - parseInt(quantity)
            }
          });
          // update inventoryTo if you ddn't just created or recovered it (they would already be updated)
          if (!newInventoryTo && !recoveredInventoryTo) {
            const updatedInventoryTo = await tx.inventory.update({
              where: {id: currentInventoryTo.id},
              data: {
                current: currentInventoryTo.current + parseInt(quantity),
                initial: currentInventoryTo.initial + parseInt(quantity)
              }
            });
          }
        // If it's a return - same process
        } else {
          const updatedInventoryFrom = await tx.inventory.update({
            where: {id: parseInt(inventoryFromId)},
            data: {
              current: currentInventoryFrom.current - parseInt(quantity),
              returns: currentInventoryFrom.returns + parseInt(quantity),
            }
          });

          if (!newInventoryTo && !recoveredInventoryTo) {
            const updatedInventoryTo = await tx.inventory.update({
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
    })
    
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
        userId: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            id: true
          }
        },
        forMonth: true,
        sales: {
          select: {
            id: true,
            quantity: true,
            isDeleted: true,
            inventory: {
              select: {
                id: true,
                price: true,
                bookstore: {
                  select: {
                    id: true,
                    comissions: true,
                    deal_percentage: true
                  }
                }
              }
            }
          }
        },
        costs: {
          select: {
            id: true,
            amount: true,
            isDeleted: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    for (const payment of selectedPayments) {
      payment.amount = 0;

      const userWithCategory = await prisma.user.findUnique({
        where: {
          id : payment.userId
        },
        include: {
          category: true
        }
      })

      if (payment.sales.length > 0) {
        for (const sale of payment.sales) {
          if (sale.isDeleted === false) {
            payment.amount += calculateAuthorRevenue(
              sale.inventory.bookstore.comissions,
              sale.inventory.price,
              userWithCategory.category.management_min,
              sale.inventory.bookstore.deal_percentage,
              sale.quantity
            )
          }
        }
      };

      if (payment.costs.length > 0) {
        for (const cost of payment.costs) {
          if (cost.isDeleted === false) {
            payment.amount -= cost.amount
          }
        }
      }
    }

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
    } else {
      res.status(500).json({error:"a server error occurred while updating payments"});
    }

  } catch(error) {
    console.error("\n ERROR MARKING PAYMENT AS PAID \n", error);
    res.status(500).json({error:"a server error occurred while updating payments"})
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

    await prisma.$transaction(async (tx) => {
      const createdCost = await tx.cost.create({
        data: {
          paymentId: paymentId,
          amount: amount,
          note: note
        }
      });

      if (createdCost) {
        // const previousPayment = await tx.payment.findUnique({
        //   where: {
        //     id: paymentId
        //   },
        //   select: {
        //     amount: true
        //   }
        // });

        // const updatedPayment = await tx.payment.update({
        //   where: {
        //     id: paymentId
        //   },
        //   data: {
        //     amount: previousPayment.amount - createdCost.amount
        //   }
        // })
        res.status(200).json({message: "Cost created sucessfully"});
      } else {
        res.status(500).json({error:"a server error occurred while creating the cost"})
      }
    })
    
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

    await prisma.$transaction(async (tx) => {
      // const previousCost = await tx.cost.findUnique({
      //   where: {
      //     id: costId
      //   }
      // })
      
      const updatedCost = await tx.cost.update({
        where: {
          id: costId
        },
        data: {
          amount: amount,
          note: note
        }
      })

      // if (updatedCost) {
      //   const previousPayment = await tx.payment.findUnique({
      //     where: {
      //       id: updatedCost.paymentId
      //     }
      //   });

      //   if (previousPayment) {
      //     const updatedPayment = await tx.payment.update({
      //       where: {
      //         id: updatedCost.paymentId
      //       },
      //       data: {
      //         amount: previousPayment.amount + previousCost.amount - updatedCost.amount
      //       }
      //     })
      //   }
      // }
    })

    res.status(200).json({message: "The cost was updated successfully"});
  } catch (error) {
    console.error("\n ERROR UPDATING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while updating the cost"})
  }
}) 

router.delete('/cost/:id', async (req, res) => {
  try {
    const costId = parseInt(req.params.id);

    await prisma.$transaction(async (tx) => {
      const markedAsDeletedCost = await tx.cost.update({
        where: {
          id: costId
        },
        data: {
          isDeleted: true
        }
      });

      // if (markedAsDeletedCost) {
      //   const previousPayment = await tx.payment.findUnique({
      //     where: {
      //       id: markedAsDeletedCost.paymentId
      //     }
      //   });

      //   if (previousPayment) {
      //     const updatedPayment = await tx.payment.update({
      //       where: {
      //         id: markedAsDeletedCost.paymentId
      //       },
      //       data: {
      //         amount: previousPayment.amount + markedAsDeletedCost.amount
      //       }
      //     })
      //   }
      // }
    })

    res.status(200).json({message: "The cost was deleted successfully"});
  } catch (error) {
    console.error("\n ERROR DELETING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while deleting the cost"})
  }
})

/// soft delete on cascade

async function softDeleteBooksOnCascade(deletedAuthor, tx) {
  const booksToDelete = await tx.book.findMany({
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
      const deletedBook = await tx.book.update({
        where: {id: book.id},
        data: {isDeleted: true}
      })
      deletedBooksIds.push(deletedBook.id);
    };
  };

  return deletedBooksIds;
}

async function softDeletePaymentsOnCascade(deletedAuthor, tx) {
  const paymentsToDelete = await tx.payment.findMany({
    where: {
      userId: deletedAuthor.id,
      isDeleted: false
    }
  })

  let deletedPaymentsIds=[];
  for (const payment of paymentsToDelete) {
    const deletedPayment = await tx.payment.update({
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

async function softDeleteInventoriesOnCascade(IdsList, cascadeType, tx) {
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
    const relatedInventories = await tx.inventory.findMany({
      where: {[filter]: id}
    });
    for (const inventory of relatedInventories) {
      inventoriesToDelete.push(inventory.id);
    };
  };

  let deletedInventoriesIds = [];
  for (const inventoryId of inventoriesToDelete) {
    const deletedInventory =  await tx.inventory.update({
      where: {id: inventoryId},
      data: {isDeleted: true},
    });
    deletedInventoriesIds.push(deletedInventory.id);
  };
  return deletedInventoriesIds;
}

async function softDeleteImpressionsOnCascade(deletedBook, tx) {
  const impressionsToDelete = await tx.impression.findMany({
    where: {
      bookId: deletedBook.id,
      isDeleted: false
    },
  });

  let deletedImpressionsIds = [];
  for (const impression of impressionsToDelete) {
    const deletedImpression = await tx.impression.update({
      where : {id: impression.id},
      data: {isDeleted: true}
    })
    deletedImpressionsIds.push(deletedImpression.id)
  };
  return deletedImpressionsIds;
}

async function softDeleteSalesOnCascade(IdsList, tx) {
  let salesToDelete = [];

  for (const id of IdsList) {
    const relatedSales = await tx.sale.findMany({
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
      await tx.sale.update({
        where: {id: sale.id},
        data: { isDeleted: true}
      })
    })
  );

  // for (const sale of salesToDelete) {
  //   // update all potential authors payments sums as well
  //   const date = new Date(sale.createdAt);
  //   const year = String(date.getFullYear());
  //   const month = String(date.getMonth() + 1).padStart(2, '0');
  //   const saleForMonth = year + "-" + month

  //   const bookOfSale = await tx.book.findUnique({
  //     where: {
  //       id: sale.inventory.bookId
  //     },
  //     select: {
  //       users: {
  //         select: {
  //           id: true
  //         }
  //       }
  //     }
  //   })
  //   const userIds = bookOfSale.users.map(user => user.id);

  //   // update the payment for each author of the book
  //   if (userIds.length > 0) {
  //     for (const id of userIds) {
  //       // using findMany instead of findUnique here to avoid the error if not found.
  //       const relatedPayment = await tx.payment.findMany({
  //         where: {
  //           userId: id,
  //           forMonth: saleForMonth,
  //           isDeleted: false
  //         }
  //       })

  //       const userCategory = await tx.user.findUnique({
  //         where: {
  //           id: id,
  //           isDeleted: false
  //         },
  //         select: {
  //           category: {
  //             select: {
  //               percentage_royalties: true,
  //               percentage_management_stores: true,
  //               management_min: true
  //             }
  //           }
  //         }
  //       })

  //       let newPaymentAmount = relatedPayment[0].amount - calculateAuthorRevenue(
  //         sale.inventory.bookstore.comissions,
  //         sale.inventory.price,
  //         userCategory.category.management_min,
  //         userCategory.category.percentage_management_stores,
  //         sale.quantity,
  //       )
  //       if (newPaymentAmount < 0.01) {
  //         newPaymentAmount = 0
  //       }
  //       const updatedRelatedPayment = await tx.payment.update({
  //         where: {
  //           id: relatedPayment[0].id
  //         },
  //         data: {
  //           amount: newPaymentAmount
  //         }
  //       })
  //     }
  //   }
  // }
}

async function softDeleteCostsOnCascade(deletedPaymentId, tx) {
  const costsToDelete = await tx.cost.findMany({
    where: {
      paymentId: deletedPaymentId,
      isDeleted: false
    }
  });

  let deletedCostsIds = [];
  for (const cost of costsToDelete) {
    const deletedCost = await tx.cost.update({
      where: {id: cost.id},
      data: {isDeleted: true}
    });
    deletedCostsIds.push(deletedCost.id)
  };

  return deletedCostsIds;
}

// updateOnCascade routes

// async function updatePaymentsOnCascade(category, previousCategory, tx) {
//   const impactedUsers = await tx.user.findMany({
//     where: {
//       categoryId: category.id,
//       isDeleted: false
//     }
//   });

//   if (impactedUsers.length === 0) {
//     return;
//   }

//   let impactedSales = [];
//   for (const user of impactedUsers) {
//     const impactedBooks = await tx.book.findMany({
//       where: {
//         users: {
//           some: {
//             id: user.id
//           }
//         },
//         isDeleted: false
//       },
//       include: {
//         users: true
//       }
//     })

//     for (const book of impactedBooks) {
//       const numberOfAuthors = book.users.length
//       const impactedInventories = await tx.inventory.findMany({
//         where: {
//           bookId: book.id,
//           isDeleted: false
//         },
//         include: {
//           bookstore: true
//         }
//       })

//       for (const inventory of impactedInventories) {
//         const impactedSalesForInventory = await tx.sale.findMany({
//           where: {
//             inventoryId: inventory.id,
//             isDeleted: false
//           }
//         });
  
//         for (const sale of impactedSalesForInventory) {
//           impactedSales.push(
//             {...sale, 
//             "userId": user.id,
//             "price": inventory.price,
//             "comissions": inventory.bookstore.comissions,
//             "numberOfAuthors": numberOfAuthors}
//           )
//         };
//       }
//     }
//   }

//   for (const sale of impactedSales) {
//     const paymentForMonth = getForMonth(sale.createdAt);
//     const previousSaleValue = calculateAuthorRevenue(
//       sale.comissions,
//       sale.price,
//       previousCategory.management_min,
//       previousCategory.percentage_management_stores,
//       sale.quantity,
//     );
//     const newSaleValue = calculateAuthorRevenue(
//       sale.comissions,
//       sale.price,
//       category.management_min,
//       category.percentage_management_stores,
//       sale.quantity,
//     )

//     const previousPayment = await tx.payment.findUnique({
//       where: {
//         userId_forMonth: {
//           userId: sale.userId,
//           forMonth: paymentForMonth,
//         },
//         isDeleted: false
//       }
//     });

//     const quantityUpdate = newSaleValue - previousSaleValue

//     if (previousPayment && previousPayment.status !== "paid") {
//       const updatedPayment = await tx.payment.update({
//         where: {
//           userId_forMonth: {
//             userId: sale.userId,
//             forMonth: paymentForMonth,
//           },
//           isDeleted: false
//         },
//         data: {
//           amount: previousPayment.amount + quantityUpdate
//         }
//       })
//     }
//   }
// }

// async function updatePaymentsOnCascadeFromBookstore(bookstore, tx) {
//   let impactedSales = [];
//   const impactedInventories = await tx.inventory.findMany({
//     where: {
//       bookstoreId: bookstore.id,
//       isDeleted: false
//     },
//     include: {
//       bookstore: true,
//       book: true,
//       sales: true
//     }
//   });

//   for (const inventory of impactedInventories) {
//     const impactedBook = await tx.book.findFirst({
//       where: {
//         id: inventory.bookId,
//         isDeleted: false
//       },
//       select: {
//         users: {
//           select: {
//             id: true,
//             category: {
//               select: {
//                 percentage_management_stores: true,
//                 percentage_royalties: true,
//                 management_min: true
//               }
//             }
//           }
//         }
//       }
//     });

//     const impactedUsers = impactedBook.users;

//     const impactedSalesForInventory = await tx.sale.findMany({
//       where: {
//         inventoryId: inventory.id,
//         isDeleted: false
//       }
//     });

//     for (const sale of impactedSalesForInventory) {
//       for (const user of impactedUsers) {
//         impactedSales.push(
//           {...sale,
//             "userId": user.id,
//             "price": inventory.price,
//             'management_min': user.category.management_min,
//             "percentage_management_stores": user.category.percentage_management_stores,
//             "percentage_royalties": user.category.percentage_royalties,
//             "comissions": inventory.bookstore.comissions,
//             "numberOfAuthors": impactedUsers.length
//           }
//         )
//       }
//     };
//   }

//   let count = 0;
//   for (const sale of impactedSales) {
//     const paymentForMonth = getForMonth(sale.createdAt);
//     const previousSaleValue = calculateAuthorRevenue(
//       !sale.comissions,
//       sale.price,
//       sale.management_min,
//       sale.percentage_management_stores,
//       sale.quantity,
//     );
//     const newSaleValue = calculateAuthorRevenue(
//       sale.comissions,
//       sale.price,
//       sale.management_min,
//       sale.percentage_management_stores,
//       sale.quantity,
//     )
//     const previousPayment = await tx.payment.findUnique({
//       where: {
//         userId_forMonth: {
//           userId: sale.userId,
//           forMonth: paymentForMonth,
//         },
//         isDeleted: false
//       }
//     });

//     const quantityUpdate = newSaleValue - previousSaleValue

//     if (previousPayment && previousPayment.status !== "paid") {
//       const updatedPayment = await tx.payment.update({
//         where: {
//           userId_forMonth: {
//             userId: sale.userId,
//             forMonth: paymentForMonth,
//           },
//           isDeleted: false
//         },
//         data: {
//           amount: previousPayment.amount + quantityUpdate
//         }
//       });
//     }
//   }
// }

// async function updatePaymentsOnCascadeFromInventory(inventory, previousPrice, tx) {
//   let impactedSales = [];
//   const impactedBook = await tx.book.findFirst({
//     where: {
//       id: inventory.bookId,
//       isDeleted: false
//     },
//     select: {
//       users: {
//         select: {
//           id: true,
//           category: {
//             select: {
//               percentage_management_stores: true,
//               percentage_royalties: true,
//               management_min: true
//             }
//           }
//         }
//       }
//     }
//   });

//   const impactedUsers = impactedBook.users;
//   const relatedBookstore = await tx.bookstore.findFirst({
//     where: {
//       id: inventory.bookstoreId,
//       isDeleted: false
//     },
//     select: {
//       comissions: true
//     }
//   })

//   const impactedSalesForInventory = await tx.sale.findMany({
//     where: {
//       inventoryId: inventory.id,
//       isDeleted: false
//     }
//   });

//   for (const sale of impactedSalesForInventory) {
//     for (const user of impactedUsers) {
//       impactedSales.push(
//         {...sale,
//           "userId": user.id,
//           "price": inventory.price,
//           'management_min': user.category.management_min,
//           "percentage_management_stores": user.category.percentage_management_stores,
//           "percentage_royalties": user.category.percentage_royalties,
//           "comissions": relatedBookstore.comissions,
//           "numberOfAuthors": impactedUsers.length
//         }
//       )
//     }
//   };

//   for (const sale of impactedSales) {
//     const paymentForMonth = getForMonth(sale.createdAt);
//     const previousSaleValue = calculateAuthorRevenue(
//       sale.comissions,
//       previousPrice,
//       sale.management_min,
//       sale.percentage_management_stores,
//       sale.quantity,
//     );
//     const newSaleValue = calculateAuthorRevenue(
//       sale.comissions,
//       sale.price,
//       sale.management_min,
//       sale.percentage_management_stores,
//     )
//     const previousPayment = await tx.payment.findUnique({
//       where: {
//         userId_forMonth: {
//           userId: sale.userId,
//           forMonth: paymentForMonth,
//         },
//         isDeleted: false
//       }
//     });

//     const quantityUpdate = newSaleValue - previousSaleValue

//     if (previousPayment && previousPayment.status !== "paid") {
//       const updatedPayment = await tx.payment.update({
//         where: {
//           userId_forMonth: {
//             userId: sale.userId,
//             forMonth: paymentForMonth,
//           },
//           isDeleted: false
//         },
//         data: {
//           amount: previousPayment.amount + quantityUpdate
//         }
//       });
//     }
//   }
// }

export default router;
