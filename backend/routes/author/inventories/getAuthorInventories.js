import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  getWasInventoryForThisBook,
  getOtherInventoryForThisBook,
} from "../../admin/inventories/getBookInventories.js";
const router = express.Router();

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
          where: {
            isDeleted: false
          },
          select: {
            id: true,
            title: true,
            isDeleted: true,
            inventories: {
              where: {
                isDeleted: false
              },
              select: {
                initial: true,
                givenToAuthor: true,
                current: true,
                bookstoreId: true,
                bookId: true,
                bookstore: {
                  select: {
                    name: true,
                    id: true
                  }
                },
                book: {
                  select: {
                    title: true,
                    id: true,
                    impressions: {
                      where: {
                        isDeleted: false
                      },
                      orderBy: {
                        dateStr: "asc"
                      },
                      select: {
                        isDeleted: true,
                        quantity: true,
                        authorDelivery: true,
                        dateStr: true,
                        id: true
                      }
                    }
                  }
                },
                isDeleted: true,
                sales: {
                  where: {
                    isDeleted: false
                  },
                  select: {
                    quantity: true,
                    isDeleted: true
                  }
                },
                transfersFrom: {
                  where: {
                    isDeleted: false
                  },
                  select: {
                    quantity: true,
                    toInventoryId: true
                  }
                },
                transfersTo: {
                  where: {
                    isDeleted: false
                  },
                  orderBy: {
                    dateStr: "asc"
                  },
                  select: {
                    quantity: true,
                    toInventoryId: true
                  }
                }
              }
            },
            impressions: {
              where: {
                isDeleted: false
              },
              orderBy: {
                dateStr: "asc"
              },
              select: {
                quantity: true,
                authorDelivery: true,
                dateStr: true
              }
            }
          }
        },
      }
    });

    //group and format data
    let overallInitialTotal = 0;
    let overallNewImpressions = 0;
    let overallEntregadosDelAutor = 0;
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
      let entregadosDelAutorTotal = 0;
      let soldTotal = 0;
      let givenToAuthorTotal = 0;
      let remainingTotal = 0;
      let impressionsData = [];

      let bookstoresCopies = 0;
      let wasCopies = 0;

      for (const inventory of book.inventories) {
        if (inventory.bookstoreId === 1) {
          const res = getWasInventoryForThisBook(inventory) 
          overallInitialTotal += res.inicial
          overallNewImpressions += res.extraImpressions
          overallEntregadosDelAutor += res.entregadosDelAutor
          overallSoldTotal += res.ventas
          overallInventoryInWas += res.disponibles
          overallEntregadosAlAutor += res.entregadosAlAutor
          overallRemainingTotal += res.disponibles

          initialTotal += res.inicial
          newImpressionsTotal += res.extraImpressions
          entregadosDelAutorTotal += res.entregadosDelAutor
          soldTotal += res.ventas
          givenToAuthorTotal += res.entregadosAlAutor
          remainingTotal += res.disponibles
          impressionsData = res.thatBookImpressions
          wasCopies += res.disponibles
        } else {
          const res = getOtherInventoryForThisBook(inventory)
          // overallInitialTotal += res.inicial
          overallSoldTotal += res.ventas
          overallInventoryInBookstores += res.disponibles
          overallRemainingTotal += res.disponibles

          // initialTotal += res.inicial
          soldTotal += res.ventas
          remainingTotal += res.disponibles
          bookstoresCopies += res.disponibles
        }
      }

      bookInventories.push({
        bookId: book.id,
        title: book.title,
        summary: {
          bookstores: bookstoresCopies,
          was: wasCopies,
          entregadosDelAutor: entregadosDelAutorTotal,
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
        entregadosDelAutor: overallEntregadosDelAutor,
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
router.get('/authorInventories', getAuthorInventories);

export default router;