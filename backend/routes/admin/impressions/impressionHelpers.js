import { getInventoryDerived } from "../inventories/inventoryHelpers.js";

export async function validateAuthorReturn(tx, bookId, bookstoreId, quantity) {
  const returnInventory = await tx.inventory.findUnique({
    where: {
      bookId_bookstoreId: {
        bookId: bookId,
        bookstoreId: bookstoreId,
      }
    },
    include: {
      book: {
        include: {
          impressions: true
        }
      },
      sales: true,
      transfersFrom: true,
      transfersTo: true
    }
  });

  const derived = getInventoryDerived(returnInventory)
  if ((derived.entregadosDelAutor + quantity) > derived.entregadosAlAutor) {
    return false
  }

  return returnInventory
}