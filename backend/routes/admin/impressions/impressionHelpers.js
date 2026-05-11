import { getInventoryDerived } from "../inventories/inventoryHelpers.js";

export async function validateAuthorReturn(tx, bookId, quantity) {
  const wasInventory = await tx.inventory.findUnique({
    where: {
      bookId_bookstoreId: {
        bookId: bookId,
        bookstoreId: 1,
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

  const derived = getInventoryDerived(wasInventory)
  if ((derived.entregadosDelAutor + quantity) > derived.entregadosAlAutor) {
    return false
  }
  return true
}