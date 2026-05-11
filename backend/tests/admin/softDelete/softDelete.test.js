import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { validateInput } from "../../../validations.js";
import { 
  softDeleteBooksOnCascade,
  softDeletePaymentsOnCascade,
  softDeleteInventoriesOnCascade,
  softDeleteImpressionsOnCascade,
  softDeleteSalesOnCascade,
  softDeleteKindleSalesOnCascade,
  softDeleteCostsOnCascade,
} from "../../../routes/admin/softDelete/softDelete.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  createTestDB,
  dropTestDB,
  deleteFromDB
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let category1;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe(`soft delete books on cascade of an author soft deletion`, () => {
  let res;
  let author1, author2, author3;
  let book1, book2, book3, book4, book5;

  beforeAll(async() => {
    author1 = await createAuthor(prisma, {isDeleted: true})
    author2 = await createAuthor(prisma)
    author3 = await createAuthor(prisma, {isDeleted: true})
    book1 = await createBook(prisma, [author1.id])
    book2 = await createBook(prisma, [author1.id, author2.id])
    book3 = await createBook(prisma, [author1.id, author2.id, author3.id])
    book4 = await createBook(prisma, [author1.id])
    book5 = await createBook(prisma, [author1.id, author3.id])
  })

  it(`should return an array`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeleteBooksOnCascade(author1, tx)
    })
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(3)
  })

  it(`should return valid Ids`, async() => {
    for (const value of res) {
      try {
        expect(validateInput('id', value).length).toBe(0)
        const book = await prisma.book.findUnique({where: {id: value}})
        expect(book).toBeTruthy()
      } catch(error) {
        console.log(`error with ${value}`)
        throw error
      }
    }
  })

  it(`should only delete books that have don't have a valid author left`, async() => {
    expect(res).toContain(book1.id)
    expect(res).toContain(book4.id)
    expect(res).toContain(book5.id)
    expect(res).not.toContain(book2.id)
    expect(res).not.toContain(book3.id)
  })

  it(`should mark these books as deleted`, async() => {
    const delBook1 = await prisma.book.findUnique({where: {id: book1.id}})
    expect(delBook1.isDeleted).toBe(true)

    const delBook4 = await prisma.book.findUnique({where: {id: book4.id}})
    expect(delBook4.isDeleted).toBe(true)

    const delBook5 = await prisma.book.findUnique({where: {id: book5.id}})
    expect(delBook5.isDeleted).toBe(true)

    const delBook2 = await prisma.book.findUnique({where: {id: book2.id}})
    expect(delBook2.isDeleted).toBe(false)

    const delBook3 = await prisma.book.findUnique({where: {id: book3.id}})
    expect(delBook3.isDeleted).toBe(false)
  })
})



describe(`soft delete payments on cascade after an author soft deletion`, () => {
  let res;
  let author1;
  let payment1, payment2, payment3;

  beforeAll(async() => {
    author1 = await createAuthor(prisma, {isDeleted: true})
    payment1 = await createPayment(prisma, author1.id, "2025-11")
    payment2 = await createPayment(prisma, author1.id, "2025-10")
    payment3 = await createPayment(prisma, author1.id, "2025-09")
  })

  it(`should return an array`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeletePaymentsOnCascade(author1, tx)
    })
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(3)
  })

  it(`should return valid Ids`, async() => {
    for (const value of res) {
      try {
        expect(validateInput('id', value).length).toBe(0)
        const payment = await prisma.payment.findUnique({where: {id: value}})
        expect(payment).toBeTruthy()
      } catch(error) {
        console.log(`error with ${value}`)
        throw error
      }
    }
  })

  it(`should mark these payments as deleted`, async() => {
    const delPayment1 = await prisma.payment.findUnique({where: {id: payment1.id}})
    expect(delPayment1.isDeleted).toBe(true)

    const delPayment2 = await prisma.payment.findUnique({where: {id: payment2.id}})
    expect(delPayment2.isDeleted).toBe(true)

    const delPayment3 = await prisma.payment.findUnique({where: {id: payment3.id}})
    expect(delPayment3.isDeleted).toBe(true)
  })
})



describe(`soft delete inventories on cascade after a book deletion`, () => {
  let res;
  let author1;
  let book1, book2, book3;
  let bookstore1, bookstore2, bookstore3;
  let inventory1, inventory2, inventory3, inventory4, inventory5, inventory6;
  let inventory7, inventory8, inventory9;

  beforeAll(async() => {
    author1 = await createAuthor(prisma)
    book1 = await createBook(prisma, [author1.id], {isDeleted: true})
    book2 = await createBook(prisma, [author1.id])
    book3 = await createBook(prisma, [author1.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    bookstore3 = await createBookstore(prisma, {isDeleted: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id)
    inventory2 = await createInventory(prisma, book1.id, bookstore2.id)
    inventory3 = await createInventory(prisma, book1.id, bookstore3.id)
    inventory4 = await createInventory(prisma, book2.id, bookstore1.id)
    inventory5 = await createInventory(prisma, book2.id, bookstore2.id)
    inventory6 = await createInventory(prisma, book2.id, bookstore3.id)
    inventory7 = await createInventory(prisma, book3.id, bookstore1.id)
    inventory8 = await createInventory(prisma, book3.id, bookstore2.id)
    inventory9 = await createInventory(prisma, book3.id, bookstore3.id)
  })

  it(`should return an array`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeleteInventoriesOnCascade([book1.id], "books", tx)
    })
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(3)
  })

  it(`should return valid Ids`, async() => {
    for (const value of res) {
      try {
        expect(validateInput('id', value).length).toBe(0)
        const inventory = await prisma.inventory.findUnique({where: {id: value}})
        expect(inventory).toBeTruthy()
      } catch(error) {
        console.log(`error with ${value}`)
        throw error
      }
    }
  })

  it(`should mark these inventories as deleted`, async() => {
    const delInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}})
    expect(delInventory1.isDeleted).toBe(true)

    const delInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}})
    expect(delInventory2.isDeleted).toBe(true)

    const delInventory3 = await prisma.inventory.findUnique({where: {id: inventory3.id}})
    expect(delInventory3.isDeleted).toBe(true)
  })
})



describe(`soft delete inventories on cascade after a bookstore deletion`, () => {
  let res;
  let author1;
  let book1, book2, book3;
  let bookstore1, bookstore2, bookstore3;
  let inventory1, inventory2, inventory3, inventory4, inventory5, inventory6;
  let inventory7, inventory8, inventory9;

  beforeAll(async() => {
    author1 = await createAuthor(prisma)
    book1 = await createBook(prisma, [author1.id], {isDeleted: true})
    book2 = await createBook(prisma, [author1.id])
    book3 = await createBook(prisma, [author1.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    bookstore3 = await createBookstore(prisma, {isDeleted: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id)
    inventory2 = await createInventory(prisma, book1.id, bookstore2.id)
    inventory3 = await createInventory(prisma, book1.id, bookstore3.id)
    inventory4 = await createInventory(prisma, book2.id, bookstore1.id)
    inventory5 = await createInventory(prisma, book2.id, bookstore2.id)
    inventory6 = await createInventory(prisma, book2.id, bookstore3.id)
    inventory7 = await createInventory(prisma, book3.id, bookstore1.id)
    inventory8 = await createInventory(prisma, book3.id, bookstore2.id)
    inventory9 = await createInventory(prisma, book3.id, bookstore3.id)
  })

  it(`should return an array`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeleteInventoriesOnCascade([bookstore3.id], "bookstores", tx)
    })
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(3)
  })

  it(`should return valid Ids`, async() => {
    for (const value of res) {
      try {
        expect(validateInput('id', value).length).toBe(0)
        const inventory = await prisma.inventory.findUnique({where: {id: value}})
        expect(inventory).toBeTruthy()
      } catch(error) {
        console.log(`error with ${value}`)
        throw error
      }
    }
  })

  it(`should mark these inventories as deleted`, async() => {
    const delInventory1 = await prisma.inventory.findUnique({where: {id: inventory3.id}})
    expect(delInventory1.isDeleted).toBe(true)

    const delInventory2 = await prisma.inventory.findUnique({where: {id: inventory6.id}})
    expect(delInventory2.isDeleted).toBe(true)

    const delInventory3 = await prisma.inventory.findUnique({where: {id: inventory9.id}})
    expect(delInventory3.isDeleted).toBe(true)
  })
})



describe(`soft delete inventories on cascade after several books deletion`, () => {
  let res;
  let author1;
  let book1, book2, book3;
  let bookstore1, bookstore2, bookstore3;
  let inventory1, inventory2, inventory3, inventory4, inventory5, inventory6;
  let inventory7, inventory8, inventory9;

  beforeAll(async() => {
    author1 = await createAuthor(prisma)
    book1 = await createBook(prisma, [author1.id], {isDeleted: true})
    book2 = await createBook(prisma, [author1.id], {isDeleted: true})
    book3 = await createBook(prisma, [author1.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    bookstore3 = await createBookstore(prisma, {isDeleted: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id)
    inventory2 = await createInventory(prisma, book1.id, bookstore2.id)
    inventory3 = await createInventory(prisma, book1.id, bookstore3.id)
    inventory4 = await createInventory(prisma, book2.id, bookstore1.id)
    inventory5 = await createInventory(prisma, book2.id, bookstore2.id)
    inventory6 = await createInventory(prisma, book2.id, bookstore3.id)
    inventory7 = await createInventory(prisma, book3.id, bookstore1.id)
    inventory8 = await createInventory(prisma, book3.id, bookstore2.id)
    inventory9 = await createInventory(prisma, book3.id, bookstore3.id)
  })

  it(`should return an array`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeleteInventoriesOnCascade([book1.id, book2.id], "books", tx)
    })
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(6)
  })

  it(`should return valid Ids`, async() => {
    for (const value of res) {
      try {
        expect(validateInput('id', value).length).toBe(0)
        const inventory = await prisma.inventory.findUnique({where: {id: value}})
        expect(inventory).toBeTruthy()
      } catch(error) {
        console.log(`error with ${value}`)
        throw error
      }
    }
  })

  it(`should mark these inventories as deleted`, async() => {
    const delInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}})
    expect(delInventory1.isDeleted).toBe(true)

    const delInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}})
    expect(delInventory2.isDeleted).toBe(true)

    const delInventory3 = await prisma.inventory.findUnique({where: {id: inventory3.id}})
    expect(delInventory3.isDeleted).toBe(true)

    const delInventory4 = await prisma.inventory.findUnique({where: {id: inventory4.id}})
    expect(delInventory4.isDeleted).toBe(true)

    const delInventory5 = await prisma.inventory.findUnique({where: {id: inventory5.id}})
    expect(delInventory5.isDeleted).toBe(true)

    const delInventory6 = await prisma.inventory.findUnique({where: {id: inventory6.id}})
    expect(delInventory6.isDeleted).toBe(true)
  })
})



describe(`soft delete impressions on cascade after a book soft deletion`, () => {
  let res;
  let author1;
  let book1;
  let impression1, impression2, impression3, impression4;

  beforeAll(async() => {
    author1 = await createAuthor(prisma, {isDeleted: true})
    book1 = await createBook(prisma, [author1.id], {isDeleted: true})
    impression1 = await createImpression(prisma, book1.id)
    impression2 = await createImpression(prisma, book1.id)
    impression3 = await createImpression(prisma, book1.id)
    impression4 = await createImpression(prisma, book1.id, {isDeleted: true})
  })

  it(`should return an array`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeleteImpressionsOnCascade(book1.id, tx)
    })
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(3)
  })

  it(`should return valid Ids`, async() => {
    for (const value of res) {
      try {
        expect(validateInput('id', value).length).toBe(0)
        const book = await prisma.impression.findUnique({where: {id: value}})
        expect(book).toBeTruthy()
      } catch(error) {
        console.log(`error with ${value}`)
        throw error
      }
    }
  })

  it(`should mark these impressions as deleted`, async() => {
    const delImpression1 = await prisma.impression.findUnique({where: {id: impression1.id}})
    expect(delImpression1.isDeleted).toBe(true)

    const delImpression2 = await prisma.impression.findUnique({where: {id: impression2.id}})
    expect(delImpression2.isDeleted).toBe(true)

    const delImpression3 = await prisma.impression.findUnique({where: {id: impression3.id}})
    expect(delImpression3.isDeleted).toBe(true)
  })
})



describe(`soft delete sales on cascade after an inventory soft deletion`, () => {
  let res;
  let author1, author2;
  let book1;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let payment1, payment2;
  let sale1, sale2;

  beforeAll(async() => {
    author1 = await createAuthor(prisma)
    author2 = await createAuthor(prisma)
    book1 = await createBook(prisma, [author1.id, author2.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id)
    inventory2 = await createInventory(prisma, book1.id, bookstore2.id)
    payment1 = await createPayment(prisma, author1.id, "2025-11")
    payment2 = await createPayment(prisma, author2.id, "2025-11")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id, payment2.id])
    sale2 = await createSale(prisma, inventory2.id, [payment1.id, payment2.id])
  })

  it(`should mark these sales as deleted`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeleteSalesOnCascade([inventory1.id, inventory2.id], tx)
    })
    const delSale1 = await prisma.sale.findUnique({where: {id: sale1.id}})
    expect(delSale1.isDeleted).toBe(true)

    const delSale2 = await prisma.sale.findUnique({where: {id: sale2.id}})
    expect(delSale2.isDeleted).toBe(true)
  })
})



describe(`soft delete kindle sales on cascade after a book soft deletion`, () => {
  let res;
  let author1, author2;
  let book1;
  let payment1, payment2;
  let kindleSale1, kindleSale2, kindleSale3;

  beforeAll(async() => {
    author1 = await createAuthor(prisma)
    author2 = await createAuthor(prisma)
    book1 = await createBook(prisma, [author1.id, author2.id])
    payment1 = await createPayment(prisma, author1.id, "2025-11")
    payment2 = await createPayment(prisma, author2.id, "2025-11")
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id, payment2.id])
    kindleSale2 = await createKindleSale(prisma, book1.id, [payment1.id, payment2.id])
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment1.id, payment2.id])
  })

  it(`should return an array`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeleteKindleSalesOnCascade(book1.id, tx)
    })
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(3)
  })

  it(`should return valid Ids`, async() => {
    for (const value of res) {
      try {
        expect(validateInput('id', value).length).toBe(0)
        const kindleSale = await prisma.kindleSale.findUnique({where: {id: value}})
        expect(kindleSale).toBeTruthy()
      } catch(error) {
        console.log(`error with ${value}`)
        throw error
      }
    }
  })

  it(`should mark these kindleSales as deleted`, async() => {
    const delKindleSale1 = await prisma.kindleSale.findUnique({where: {id: kindleSale1.id}})
    expect(delKindleSale1.isDeleted).toBe(true)

    const delKindleSale2 = await prisma.kindleSale.findUnique({where: {id: kindleSale2.id}})
    expect(delKindleSale2.isDeleted).toBe(true)

    const delKindleSale3 = await prisma.kindleSale.findUnique({where: {id: kindleSale3.id}})
    expect(delKindleSale3.isDeleted).toBe(true)
  })
})



describe(`soft delete costs on cascade after a book soft deletion`, () => {
  let res;
  let author1, author2;
  let book1;
  let payment1, payment2;
  let cost1, cost2;

  beforeAll(async() => {
    author1 = await createAuthor(prisma)
    author2 = await createAuthor(prisma)
    book1 = await createBook(prisma, [author1.id, author2.id])
    payment1 = await createPayment(prisma, author1.id, "2025-11")
    payment2 = await createPayment(prisma, author2.id, "2025-11")
    cost1 = await createCost(prisma, payment1.id, book1.id)
    cost2 = await createCost(prisma, payment2.id, book1.id)
  })

  it(`should return an array`, async() => {
    res = await prisma.$transaction(async(tx) => {
      return await softDeleteCostsOnCascade(book1.id, tx)
    })
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(2)
  })

  it(`should return valid Ids`, async() => {
    for (const value of res) {
      try {
        expect(validateInput('id', value).length).toBe(0)
        const kindleSale = await prisma.kindleSale.findUnique({where: {id: value}})
        expect(kindleSale).toBeTruthy()
      } catch(error) {
        console.log(`error with ${value}`)
        throw error
      }
    }
  })

  it(`should mark these costs as deleted`, async() => {
    const delCost1 = await prisma.cost.findUnique({where: {id: cost1.id}})
    expect(delCost1.isDeleted).toBe(true)

    const delCost2 = await prisma.cost.findUnique({where: {id: cost2.id}})
    expect(delCost2.isDeleted).toBe(true)
  })
})