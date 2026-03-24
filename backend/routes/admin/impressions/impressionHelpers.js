import { getInventoryDerived } from "../inventories/inventoryHelpers";

export async function checkRemainingAvailablesForThisBook(tx, impressionId) {
  const selectedImpression = await tx.impression.findUnique({
    where: {
      id: impressionId
    }
  })

  //1.2 Get all inventories with the book for this impression
  const allThisBookInventories = await tx.inventory.findMany({
    where: {
      bookId: selectedImpression.bookId
    },
    include: {
      book: {
        include: {
          impressions: true
        }
      },
      bookstore: true,
      sales: true,
      transfersFrom: true,
      transfersTo: true
    }
  });

  //1.3 get a total of available copies for all these inventories
  let totalDisponibles = 0
  for (const inventory of allThisBookInventories) {
    const derived = getInventoryDerived(inventory)
    totalDisponibles += derived.disponibles
  }

  //1.4 finally check
  if (totalDisponibles < selectedImpression.quantity) {
    return false
  } else {
    return true
  }
}