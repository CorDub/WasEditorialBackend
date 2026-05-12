import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
} from "../../../utils.js";
const router = express.Router();

export async function softDeleteBooksOnCascade(deletedAuthor, tx) {
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
      let validAuthorFound = false;
      for (const user of book.users) {
        if (!user.isDeleted) {
          validAuthorFound = true
          break;
        }
      }

      if (validAuthorFound) {continue};

      const deletedBook = await tx.book.update({
        where: {id: book.id},
        data: {isDeleted: true}
      })
      deletedBooksIds.push(deletedBook.id);
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

export async function softDeletePaymentsOnCascade(deletedAuthor, tx) {
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

export async function softDeleteInventoriesOnCascade(IdsList, cascadeType, tx) {
  let filter = '';
  if (cascadeType === "books") {
    filter = "bookId"
  } else if (cascadeType === "bookstores") {
    filter = "bookstoreId"
  } else {
    console.error("There was an error soft deleting inventories on cascade");
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

export async function softDeleteImpressionsOnCascade(deletedBookId, tx) {
  const impressionsToDelete = await tx.impression.findMany({
    where: {
      bookId: deletedBookId,
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

export async function softDeleteSalesOnCascade(IdsList, tx) {
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
}

export async function softDeleteKindleSalesOnCascade(deletedBookId, tx) {
  const kindleSalesToDelete = await tx.kindleSale.findMany({
    where: {
      bookId: deletedBookId,
      isDeleted: false
    }
  })

  let deletedKindleSaleIds = [];
  for (const kindleSale of kindleSalesToDelete) {
    const deletedKindleSale = await tx.kindleSale.update({
      where: {
        id: kindleSale.id
      },
      data: {
        isDeleted: true
      }
    })
    deletedKindleSaleIds.push(deletedKindleSale.id)
  }

  return deletedKindleSaleIds;
}

export async function softDeleteCostsOnCascade(deletedBookId, tx) {
  const costsToDelete = await tx.cost.findMany({
    where: {
      bookId: deletedBookId,
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

export default router;