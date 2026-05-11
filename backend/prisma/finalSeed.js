import {PrismaClient, Role} from "@prisma/client";
import bcrypt from "bcrypt";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from "url";
import { error } from "console";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authorsPath = path.join(__dirname, 'finalAuthorList.json');
const booksPath = path.join(__dirname, "finalBooksList.json");
const additionalBooksPath = path.join(__dirname, "fourthBooks.json");

const authorsRaw = await fs.readFile(authorsPath, 'utf-8');
const booksRaw = await fs.readFile(booksPath, 'utf-8');
const additionalBooksRaw = await fs.readFile(additionalBooksPath, "utf-8");

const authors = JSON.parse(authorsRaw);
const books = JSON.parse(booksRaw);
const additionalBooks = JSON.parse(additionalBooksRaw);

async function addAuthorFromDB(author) {
  try {
    const createdAuthor = await prisma.user.create({
      data: {
        first_name: author.first_name,
        last_name: author.last_name,
        email: author.email,
        phone: author.phone,
        phonePrefix: author.phonePrefix,
        birthday: author.birthday,
        clabe: author.clabe,
        name_bank_account: author.name_bank_account,
        bank: author.bank
      }
    })
  } catch (error) {
    console.error(error);
    throw new Error ("error while creating Author", {cause: {error, author}});
  }
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// async function addBookFromDB(book) {
//   try {
//     const preparedBook = {
//       title: book.title,
//       isbn: book.isbn,
//       pasta: book.pasta,
//       price: 379,
//       quantity: book.quantity,
//     }
    
//     //find main Author if it exist
//     await prisma.$transaction(async (tx) => {
//       const mainAuthor = await tx.user.findUnique({
//         where: {
//           first_name_last_name: {
//             first_name: book.first_name,
//             last_name: book.last_name
//           }
//         }
//       })

//       if (!mainAuthor) {
//         console.error("main author not found")
//         throw new Error ("the main author was not found", {cause: {error, book}});
//       }

//       preparedBook["mainAuthor"] = mainAuthor.id
//       preparedBook["authors"] = [{"id":mainAuthor.id}]

//       // now find the category
//       let bookCategory;
//       for (const author of authors) {
//         if (author.full_name !== book.author_name) {
//           continue
//         } else {
//           bookCategory = author.categoryId
//         }
//       }

//       if (!bookCategory) {
//         console.log("Category not found ", book)
//         throw new Error ("the categoryId was not identified", {cause: {error, book}});
//       }

//       preparedBook["categoryId"] = bookCategory

//       //create the book using the normal logic
//       const new_book = await tx.book.create({
//         data: {
//           title: preparedBook.title,
//           pasta: preparedBook.pasta,
//           isbn: preparedBook.isbn,
//           users: {
//             connect: preparedBook.authors,
//           },
//           mainAuthor: preparedBook.mainAuthor,
//           category: {
//             connect: {"id": preparedBook.categoryId}
//           }
//         }
//       });

//       let new_impression;
//       if (new_book) {
//         new_impression = await tx.impression.create({
//           data: {
//             bookId: new_book.id,
//             quantity: preparedBook.quantity,
//             dateStr: today()
//           }
//         })
//       };

//       let new_inventory;
//       if (new_impression) {
//         new_inventory = await tx.inventory.create({
//           data: {
//             bookId: new_book.id,
//             bookstoreId: 1,
//             price: preparedBook.price,
//             initial: preparedBook.quantity,
//             current: preparedBook.quantity
//           }
//         })
//       }
//     })
    
//   } catch(error) {
//     console.error(error);
//     throw new Error ("error while creating Book", {cause: {error, book}});
//   }
// }

let processed = 0
let duplicate = 0

async function addAdditionalBookFromDB(book) {
  try {
    await prisma.$transaction(async (tx) => {
      let authors = [];

      for (let i= 0; i < book.authors.length; i++) {
        let author = await tx.user.findUnique({
          where: {
            first_name_last_name: {
              first_name: book.authors[i].first_name,
              last_name: book.authors[i].last_name
            }
          }
        })

        if (!author) {
          console.error(`author not found - book: ${book.title} - author: ${book.authors[i].first_name} ${book.authors[i].last_name}`)
          author = await tx.user.create({
            data: {
              first_name: book.authors[i].first_name,
              last_name: book.authors[i].last_name,
              email: book.authors[i].email ? book.authors[i].email : null,
              phonePrefix: book.authors[i].phonePrefix ? book.authors[i].phonePrefix : "+52",
              phone: book.authors[i].phone ? book.authors[i].phone : null,
              birthday: book.authors[i].birthday ? book.authors[i].birthday : null,
              clabe: book.authors[i].clabe ? book.authors[i].clabe : null,
              name_bank_account: book.authors[i].name_bank_account ? book.authors[i].name_bank_account : null,
              bank: book.authors[i].bank ? book.authors[i].bank : null,
              swift: book.authors[i].swift ? book.authors[i].swift : null
            }
          })
        }

        authors.push({"id": author.id})
      }

      const existingBook = await tx.book.findUnique({
        where: {
          title_mainAuthor: {
            title: book.title,
            mainAuthor: authors[0].id
          }
        }
      })
      if (existingBook) {
        console.log("Duplicate")
        duplicate += 1
      }

      if (!existingBook) {
        console.log(`Book : ${book.title}, isbn: ${book.isbn}`)
        const new_book = await tx.book.create({
          data: {
            title: book.title,
            pasta: book.pasta,
            users: {
              connect: authors,
            },
            mainAuthor: authors[0].id,
            category: {
              connect: {"id": book.category}
            },
            isbn: book.isbn ? book.isbn : null
          }
        });

        let new_impression;
        if (new_book) {
          new_impression = await tx.impression.create({
            data: {
              bookId: new_book.id,
              quantity: book.quantity,
              dateStr: today()
            }
          })
        };

        let new_inventory;
        if (new_impression) {
          new_inventory = await tx.inventory.create({
            data: {
              bookId: new_book.id,
              bookstoreId: 1,
              price: 379,
              initial: book.quantity,
              current: book.quantity
            }
          })
        }

        if (new_inventory) {
          console.log(`successfully added book ${book.title}`)
          processed += 1
        } else {
          console.log(`Couldn't add ${book.title}`)
        }
      }
    })
    
  } catch(error) {
    console.error(error);
    throw new Error ("error while creating Book", {cause: {error, book}});
  }
}

async function main() {
  try {
    /// Create categories

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);

    const cat1 = await prisma.category.create({
      data: {
        number: 1,
        category_type: "comissions",
        percentage_management_stores: 5,
        management_min: 180,
        // percentage_royalties: 20,
        // rebate_author: 50,
        createdAt: twelveMonthsAgo
      }
    })

    const cat2 = await prisma.category.create({
      data: {
        number: 2,
        category_type: "regalias",
        percentage_royalties: 20,
        // percentage_management_stores: 5,
        // management_min: 150.00,
        rebate_author: 20,
        createdAt: twelveMonthsAgo
      }
    })

    const cat3 = await prisma.category.create({
      data: {
        number: 3,
        category_type: "comissions",
        percentage_management_stores: 5,
        // rebate_author: 50,
        management_min: 150,
        createdAt: twelveMonthsAgo
      }
    })

    //Add admins for now
    await prisma.user.create({
      data: {
        first_name: "Administrator",
        last_name: "McLibro",
        email: "imake@books.com",
        password: await bcrypt.hash("bookboi", 10),
        role: Role.superadmin,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Subadmin",
        last_name: "Pedro",
        email: "yessir@gmail.com",
        password: await bcrypt.hash("bookboi2", 10),
        role: Role.admin,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Juan",
        last_name: "AdminWasEditorial",
        email: "juanadmin@waseditorial.com",
        password: await bcrypt.hash("PruebaAdmin1", 10),
        role: Role.superadmin,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Rebeca",
        last_name: "AdminWasEditorial",
        email: "rebecaadmin@waseditorial.com",
        password: await bcrypt.hash("PruebaAdmin2", 10),
        role: Role.superadmin,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Juan",
        last_name: "AutorWasEditorial",
        email: "juanautor@waseditorial.com",
        password: await bcrypt.hash("PruebaAutor1", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Rebeca",
        last_name: "AutorWasEditorial",
        email: "rebecaautor@waseditorial.com",
        password: await bcrypt.hash("PruebaAutor2", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Corentin",
        last_name: "Dubois",
        email: "corentindubois22@gmail.com",
        password: await bcrypt.hash("bookboi4", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      }
    })

    //Add all authors
    // await Promise.all(authors.map(author => addAuthorFromDB(author)));

    //Create the Was bookstore
    await prisma.bookstore.create({
      data: {
        name: "WAS Editorial",
        deal_percentage: 30,
        createdAt: twelveMonthsAgo,
        color: "#4E5981",
      }
    })

    //Add all books
    // await Promise.all(books.map(book => addBookFromDB(book)));
    // for (const book of books) {
    //   await addBookFromDB(book);
    // }

    for (const book of additionalBooks) {
      await addAdditionalBookFromDB(book);
    }
    console.log('Total books loaded:', additionalBooks.length);
    console.log(`processed ${processed} books`);
    console.log(`duplicates ${duplicate}`)

  } catch (error) {
    console.error("Something's wrong mate", error);
  }
}


main()
  .then(() => {
    console.log("Staging seed complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Staging seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });