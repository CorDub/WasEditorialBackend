import { validateInput } from "./validations.js"
import crypto from 'crypto';
import { execSync } from "node:child_process";

export async function createAuthor(
  prisma, 
  { 
    first_name = null, 
    last_name = null, 
    email = null, 
    role = "author", 
    isDeleted = false,
    referido = null,
    phone = null,
    birthday = null,
    clabe = null,
    name_bank_account = null,
    bank = null,
    swift = null,
    password = "ThisIsValidPassword71!",
    font_size = 1.0,
    reset_password_code = null,
    createdAt = new Date()
  } = {}
) {
  const uniqueFirstName = first_name === null ? `Juan${crypto.randomUUID()}` : first_name;
  const uniqueLastName = last_name === null ? `Cruz${crypto.randomUUID()}` : last_name;
  const uniqueEmail = email === null ? `${crypto.randomUUID()}@gmail.com` : email;

  const newAuthor = await prisma.user.create({
    data: {
      first_name: uniqueFirstName,
      last_name: uniqueLastName,
      email: uniqueEmail,
      role: role,
      isDeleted: isDeleted,
      referido: referido,
      phone: phone,
      birthday: birthday,
      clabe: clabe,
      name_bank_account: name_bank_account,
      bank: bank,
      swift: swift,
      password: password,
      font_size: font_size,
      reset_password_code: reset_password_code,
      createdAt : createdAt
    }
  });

  return newAuthor
}

export async function createCategory(
  prisma,
  {
    number = 1,
    category_type = "regalias", 
    management_min = 180, 
    rebate_author = 5,
    percentage_royalties = 20,
    percentage_management_stores = 5,
    isDeleted = false,
    createdAt = new Date()
  } = {}
) {
  // const finalNumber = number === null ? `catType_${crypto.randomUUID()}` : number;

  const newCategory = await prisma.category.create({
    data: {
      number: number,
      category_type: category_type,
      management_min: management_min,
      rebate_author: rebate_author,
      percentage_management_stores: percentage_management_stores,
      percentage_royalties: percentage_royalties,
      isDeleted: isDeleted,
      createdAt : createdAt
    }
  });

  return newCategory
}

export async function createBook(
  prisma, 
  userList,
  {
    title = null, 
    categoryId = 1,
    isDeleted = false,
    createdAt = new Date()
  } = {}
) {
  const validUserList = []
  for (const element of userList) {
    validUserList.push({"id": element});

    if (!element || validateInput("id", element).length > 0) {
      console.log("incorrect user list - you didn't send Ids")
      return; 
    }
  }
  const uniqueTitle = title === null ? `title_${crypto.randomUUID()}` : title;

  const newBook = await prisma.book.create({
    data: {
      title: uniqueTitle,
      users: {
        connect: validUserList
      },
      category: {
        connect: {"id": categoryId}
      },
      isDeleted: isDeleted,
      createdAt : createdAt
    }
  })

  return newBook
}

export async function createBookstore(
  prisma,  
  {
    name = null,
    isDeleted = false,
    deal_percentage = 30.00,
    contact_name = "",
    contact_phone = "",
    contact_email = "",
    createdAt = new Date(),
  } = {}
) {
  const uniqueName = name === null ? `name_${crypto.randomUUID()}` : name
  
  const newBookstore = await prisma.bookstore.create({
    data: {
      name: uniqueName,
      isDeleted: isDeleted,
      deal_percentage: deal_percentage,
      contact_name: contact_name,
      contact_phone: contact_phone,
      contact_email: contact_email,
      createdAt : createdAt
    }
  })

  return newBookstore;
}

export async function createInventory(
  prisma, 
  bookId, 
  bookstoreId,
  {
    initial = 1000, 
    current = 1000,
    returns = 0,
    price = 379,
    givenToAuthor = 0,
    isDeleted = false,
    createdAt = new Date()
  } = {}
) {
  const newInventory = await prisma.inventory.create({
    data: {
      bookId: bookId,
      bookstoreId: bookstoreId,
      initial: initial,
      current: current,
      isDeleted: isDeleted,
      returns: returns,
      givenToAuthor: givenToAuthor,
      createdAt : createdAt,
      price: price
    }
  })

  return newInventory;
}

export async function createPayment (
  prisma, 
  userId, 
  forMonth,
  {
    dateMarkedAsPaid = null, 
    status = "created",
    isDeleted = false,
    createdAt = new Date(),
    updatedAt = new Date(),
  } = {}
) {
  const newPayment = await prisma.payment.create({
    data: {
      userId: userId,
      forMonth: forMonth,
      dateMarkedAsPaid: dateMarkedAsPaid,
      status: status,
      isDeleted: isDeleted,
      createdAt: createdAt,
      updatedAt: updatedAt,
      createdAt : createdAt
    }
  })

  return newPayment;
}

export async function createSale(
  prisma, 
  inventoryId, 
  paymentsIdList, 
  {
    quantity = 10, 
    isDeleted = false, 
    date = new Date(),
    createdAt = new Date()
  } = {}
) {
  const validPaymentIdList = []
  for (const element of paymentsIdList) {
    validPaymentIdList.push({"id": element})

    if (!element || validateInput("id", element).length > 0) {
      console.log("incorrect payments id list - you didn't pass payment IDs")
      return; 
    }
  }

  const newSale = await prisma.sale.create({
    data: {
      inventoryId: inventoryId,
      payments: {
        connect: validPaymentIdList
      },
      quantity: quantity,
      isDeleted: isDeleted,
      date: date,
      createdAt : createdAt
    }
  })

  return newSale;
}

export async function createKindleSale(
  prisma, 
  bookId, 
  paymentsIdList, 
  {
    datePay = null,
    quantityEbook = 100, 
    quantityPod = 100, 
    regalias = 1000,
    isDeleted = false,
    createdAt = new Date()
  } = {}
) {
  const validDatePay = datePay == null ? new Date() : datePay;
  const validDateCut = new Date(validDatePay);
  validDateCut.setMonth(validDateCut.getMonth() - 2);

  const validPaymentIdList = []
  for (const element of paymentsIdList) {
    validPaymentIdList.push({"id": element})

    if (!element || validateInput("id", element).length > 0) {
      console.log("incorrect payments id list - you didn't pass Ids")
      return; 
    }
  }

  const newKindleSale = await prisma.kindleSale.create({
    data: {
      bookId: bookId,
      payments: {
        connect: validPaymentIdList
      },
      quantityEbook: quantityEbook,
      quantityPod: quantityPod,
      dateCut: validDateCut,
      datePay: validDatePay,
      regalias: regalias,
      isDeleted: isDeleted,
      createdAt : createdAt
    }
  })

  return newKindleSale
}

export async function createImpression(
  prisma, 
  bookId, 
  {
    quantity = 1000, 
    isDeleted=false, 
    note=null, 
    date=new Date(),
    createdAt = new Date()
  } = {}
) {
  const newImpression = await prisma.impression.create({
    data: {
      bookId: bookId,
      quantity: quantity,
      isDeleted: isDeleted,
      note: note,
      date: date,
      createdAt : createdAt
    }
  })

  return newImpression
}

export async function createTransfer(
  prisma,
  fromInventoryId,
  {
    toInventoryId=null,
    quantity=100,
    type="send",
    note=null,
    deliveryDate=null,
    place=null,
    person=null,
    isDeleted=false,
    createdAt=new Date()
  } = {}
) {
  const newTransfer = await prisma.transfer.create({
    data: {
      fromInventoryId: fromInventoryId,
      quantity: quantity,
      toInventoryId: toInventoryId,
      type: type,
      note: note,
      deliveryDate: deliveryDate,
      place: place,
      person: person,
      isDeleted: isDeleted,
      createdAt : createdAt
    }
  });

  return newTransfer;
}

export async function createCost(
  prisma, 
  paymentId, 
  bookId, 
  {
    amount = 100,
    note = null,
    date = new Date(),
    isDeleted = false,
    createdAt = new Date()
  } = {}
) {
  const newCost = await prisma.cost.create({
    data: {
      paymentId: paymentId,
      bookId: bookId,
      amount: amount,
      note: note,
      date: date,
      isDeleted: isDeleted,
      createdAt : createdAt
    }
  })

  return newCost
} 

export async function deleteFromDB(prisma, element, type) {
  if (!element) {
    return;
  }

  const types = {
    "author": (args) => prisma.user.delete(args),
    "book": (args) => prisma.book.delete(args),
    "bookstore": (args) => prisma.bookstore.delete(args),
    "inventory": (args) => prisma.inventory.delete(args),
    "payment": (args) => prisma.payment.delete(args),
    "sale": (args) => prisma.sale.delete(args),
    "cost": (args) => prisma.cost.delete(args),
    "kindleSale": (args) => prisma.kindleSale.delete(args),
    "impression": (args) => prisma.impression.delete(args),
    "category": (args) => prisma.category.delete(args),
    'transfer': (args) => prisma.transfer.delete(args)
  }

  try {
    const deletedElement = await types[type]({
      where: {
        id: element.id
      }
    })
  } catch(error) {
    console.log(`Failed to delete ${element}`, error);
    throw error
  }
}

export function createTestDB(templateName = "wasBackend_test_template") {
  const randNum = crypto.randomUUID();
  const dbName = `testDB_${randNum}`;
  execSync(`createdb ${dbName} -T ${templateName}`, { stdio: "inherit" });
  return dbName;
}

export function dropTestDB(dbName) {
  execSync(`dropdb ${dbName}`, { stdio: "inherit" });
}