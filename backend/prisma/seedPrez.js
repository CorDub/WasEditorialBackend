import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";
import {
  createAuthor,
  createBook,
  createBookstore,
  createImpression,
  createInventory,
  createSale,
  createKindleSale,
  createPayment,
  createTransfer
} from '../testUtils.js'
import { generateMonthKeysForRange } from '../utils.js';

const prisma = new PrismaClient();

async function main() {
  try {
    /// Create categories
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);

    const cat1 = await prisma.category.create({
      data: {
        type: "1",
        percentage_royalties: 100,
        percentage_management_stores: 50,
        management_min: 180.00,
        createdAt: twelveMonthsAgo
      }
    })

    const cat2 = await prisma.category.create({
      data: {
        type: "2",
        percentage_royalties: 100,
        percentage_management_stores: 55,
        management_min: 150.00,
        createdAt: twelveMonthsAgo
      }
    })

    const cat3 = await prisma.category.create({
      data: {
        type: "3",
        percentage_royalties: 20,
        percentage_management_stores: 20,
        management_min: 0.00,
        createdAt: twelveMonthsAgo
      }
    })

    /// Create author
    const juanCarlos = await createAuthor(prisma, {
      first_name: "Juan Carlos",
      last_name: "Barrios",
      email: "JuanCarlosBarrios@gmail.com",
      role: "author",
      categoryId: 1,
      phone: "5583471294",
      password: await bcrypt.hash('JuanCarlosPres', 10),
      createdAt: twelveMonthsAgo
    })

    ///Create books
    const book1 = await createBook(prisma, [juanCarlos.id], {title: "Si vas a soñar hazlo en grande", createdAt: twelveMonthsAgo})
    const book2 = await createBook(prisma, [juanCarlos.id], {title: "Cómo escribir un libro extraordinario", createdAt: twelveMonthsAgo})
    const book3 = await createBook(prisma, [juanCarlos.id], {title: "Tu calabaza gigante", createdAt: twelveMonthsAgo})

    ///Create impressions
    const impression1book1 = await createImpression(prisma, book1.id, {quantity:1000, date : new Date("2024-11-01"), createdAt: twelveMonthsAgo})
    const impression2book1 = await createImpression(prisma, book1.id, {quantity:500, date : new Date("2025-02-01"), createdAt: twelveMonthsAgo})
    const impression3 = await createImpression(prisma, book2.id, {quantity:1000, date :new Date("2025-03-01"), createdAt: twelveMonthsAgo})
    const impression4 = await createImpression(prisma, book3.id, {quantity:1000, date : new Date("2025-04-01"), createdAt: twelveMonthsAgo})

    ///Create bookstores
    const was = await createBookstore(prisma, {name:"Bodega Was", createdAt: twelveMonthsAgo})
    const gandhi = await createBookstore(prisma, {name:"Gandhi", createdAt: twelveMonthsAgo})
    const mercadoLibre = await createBookstore(prisma, {name:"Mercado Libre", createdAt: twelveMonthsAgo})
    const amazon = await createBookstore(prisma, {name:"Amazon", createdAt: twelveMonthsAgo})
    const gonvill = await createBookstore(prisma, {name:"Gonvill", createdAt: twelveMonthsAgo})
    const aeropuerto = await createBookstore(prisma, {name:"Aeropuerto CDMX", createdAt: twelveMonthsAgo})

    ///Create inventories
    const wasBook1 = await createInventory(prisma, book1.id, was.id, {initial: 1000, current: 883, createdAt: new Date("2024-11-01"), givenToAuthor: 2, returns: 10})
    const wasBook2 = await createInventory(prisma, book2.id, was.id, {initial: 1000, current: 375, createdAt: new Date("2025-03-01")})
    const wasBook3 = await createInventory(prisma, book3.id, was.id, {initial: 1000, current: 375, createdAt: new Date("2025-04-01")})

    const gandhiBook1 = await createInventory(prisma, book1.id, gandhi.id, {initial: 200, current: 190, createdAt: new Date("2024-11-01"), returns: 10})
    const gandhiBook2 = await createInventory(prisma, book2.id, gandhi.id, {initial: 200, current: 200, createdAt: new Date("2025-03-01")})
    const gandhiBook3 = await createInventory(prisma, book3.id, gandhi.id, {initial: 200, current: 200, createdAt: new Date("2025-04-01")})

    const mercadoLibreBook1 = await createInventory(prisma, book1.id, mercadoLibre.id, {initial: 100, current: 100, createdAt: new Date("2024-11-01")})
    const mercadoLibreBook2 = await createInventory(prisma, book2.id, mercadoLibre.id, {initial: 100, current: 100, createdAt: new Date("2025-03-01")})
    const mercadoLibreBook3 = await createInventory(prisma, book3.id, mercadoLibre.id, {initial: 100, current: 100, createdAt: new Date("2025-04-01")})

    const amazonBook1 = await createInventory(prisma, book1.id, amazon.id, {initial: 150, current: 150, createdAt: new Date("2024-11-01")})
    const amazonBook2 = await createInventory(prisma, book2.id, amazon.id, {initial: 150, current: 150, createdAt: new Date("2025-03-01")})
    const amazonBook3 = await createInventory(prisma, book3.id, amazon.id, {initial: 150, current: 150, createdAt: new Date("2025-04-01")})

    const gonvillBook1 = await createInventory(prisma, book1.id, gonvill.id, {initial: 125, current: 125, createdAt: new Date("2024-11-01")})
    const gonvillBook2 = await createInventory(prisma, book2.id, gonvill.id, {initial: 125, current: 125, createdAt: new Date("2025-03-01")})
    const gonvillBook3 = await createInventory(prisma, book3.id, gonvill.id, {initial: 125, current: 125, createdAt: new Date("2025-04-01")})

    const aeropuertoBook1 = await createInventory(prisma, book1.id, aeropuerto.id, {initial: 50, current: 50, createdAt: new Date("2024-11-01")})
    const aeropuertoBook2 = await createInventory(prisma, book2.id, aeropuerto.id, {initial: 50, current: 50, createdAt: new Date("2025-03-01")})
    const aeropuertoBook3 = await createInventory(prisma, book3.id, aeropuerto.id, {initial: 50, current: 50, createdAt: new Date("2025-04-01")})

    const inventories = [
      [wasBook1, gandhiBook1, mercadoLibreBook1, amazonBook1, gonvillBook1, aeropuertoBook1],
      [wasBook2, gandhiBook2, mercadoLibreBook2, amazonBook2, gonvillBook2, aeropuertoBook2],
      [wasBook3, gandhiBook3, mercadoLibreBook3, amazonBook3, gonvillBook3, aeropuertoBook3]
    ];

    ///Create transfers
    const book1Gandhi = await createTransfer(prisma, wasBook1.id, {toInventory: gandhiBook1.id, quantity: 200})
    const book1MercadoLibre = await createTransfer(prisma, wasBook1.id, {toInventory: mercadoLibreBook1.id, quantity: 100})
    const book1Amazon = await createTransfer(prisma, wasBook1.id, {toInventory: amazonBook1.id, quantity: 150})
    const book1Gonvill = await createTransfer(prisma, wasBook1.id, {toInventory: gonvillBook1.id, quantity: 125})
    const book1Aeropuerto = await createTransfer(prisma, wasBook1.id, {toInventory: aeropuertoBook1.id, quantity: 50})

    const book2Gandhi = await createTransfer(prisma, wasBook2.id, {toInventory: gandhiBook2.id, quantity: 200})
    const book2MercadoLibre = await createTransfer(prisma, wasBook2.id, {toInventory: mercadoLibreBook2.id, quantity: 100})
    const book2Amazon = await createTransfer(prisma, wasBook2.id, {toInventory: amazonBook2.id, quantity: 150})
    const book2Gonvill = await createTransfer(prisma, wasBook2.id, {toInventory: gonvillBook2.id, quantity: 125})
    const book2Aeropuerto = await createTransfer(prisma, wasBook2.id, {toInventory: aeropuertoBook2.id, quantity: 50})

    const book3Gandhi = await createTransfer(prisma, wasBook3.id, {toInventory: gandhiBook3.id, quantity: 200})
    const book3MercadoLibre = await createTransfer(prisma, wasBook3.id, {toInventory: mercadoLibreBook3.id, quantity: 100})
    const book3Amazon = await createTransfer(prisma, wasBook3.id, {toInventory: amazonBook3.id, quantity: 150})
    const book3Gonvill = await createTransfer(prisma, wasBook3.id, {toInventory: gonvillBook3.id, quantity: 125})
    const book3Aeropuerto = await createTransfer(prisma, wasBook3.id, {toInventory: aeropuertoBook3.id, quantity: 50})

    ///Create payments
    const keys = generateMonthKeysForRange(new Date("2024-11-01"), new Date());
    for (let i = 0; i < keys.length; i++) {
      let datePaid = new Date(keys[i] + "-01");
      if (i <= (keys.length - 3)) {
        datePaid.setMonth(datePaid.getMonth() + 1);
        datePaid.setDate(15);
        const payment = await createPayment(prisma, juanCarlos.id, keys[i], {dateMarkedAsPaid: datePaid, status: "paid"})
      } else if (i === (keys.length - 2)) {
        datePaid = null;
        const payment = await createPayment(prisma, juanCarlos.id, keys[i], {dateMarkedAsPaid: datePaid, status: "created"})
      } else if (i === (keys.length - 1)) {
        datePaid = null;
        const payment = await createPayment(prisma, juanCarlos.id, keys[i], {dateMarkedAsPaid: datePaid, status: "created"})
      }
    }

    //Create sales
    for (let i = 0; i < inventories.length; i++) {
      const startDates = [new Date("2024-11-01"), new Date("2025-03-01"), new Date("2025-04-01")]
      const keys = generateMonthKeysForRange(startDates[i], new Date());
      
      for (const inventory of inventories[i]) {
        let remaining = inventory.current;

        for (const key of keys) {
          if (remaining <= 0 ) {break}
          const payment = await prisma.payment.findUnique({
            where: {
              userId_forMonth: {
                userId: juanCarlos.id,
                forMonth: key
              }
            }
          })

          const day = Math.floor(Math.random() * 28) + 1;

          let quantity = Math.floor((Math.random() * remaining) / 3);
          if (quantity === 0) {
            quantity = 1;
          }

          remaining -= quantity
          const sale = await createSale(
            prisma, 
            inventory.id, 
            [payment.id], 
            {
              quantity: quantity, 
              date: new Date(key + "-" + day),
              createdAt: new Date(key + "-" + day)
            }
          )

          const updatedInventory = await prisma.inventory.update({
            where: {
              id: inventory.id
            },
            data: {
              current: remaining
            }
          })
        }
      }
    }

    //Create kindleSales
    for (const key of keys) {
      const payment = await prisma.payment.findUnique({where: {
        userId_forMonth: {
          userId: juanCarlos.id,
          forMonth: key
        }
      }})
      const day = Math.floor(Math.random() * 28) + 1;
      const quantity = Math.floor(Math.random() * 10) + 1;
      const quantityPod = Math.floor(quantity * 0.2) === 0 ? 1 : Math.floor(quantity * 0.2);
      const regalias = (quantity + quantityPod) * 149.99;

      const kindleSale = await createKindleSale(
        prisma, 
        book1.id, 
        [payment.id], 
        {
          quantityEbook: quantity,
          quantityPod: quantityPod,
          regalias: regalias,
          datePay: new Date(key + "-" + day),
          createdAt: new Date(key + "-" + day)
        }
      )
    }

  } catch(error) {
    console.error("Error somewhere: ", error)
  }
}

main()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async() => {
    await prisma.$disconnect();
  })