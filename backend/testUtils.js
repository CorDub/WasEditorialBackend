import { validateInput } from "validations.js"

export async function createAuthor(prisma, first_name, last_name, email, role, isDeleted, categoryId) {
  const newAuthor = await prisma.user.create({
    data: {
      first_name: first_name,
      last_name: last_name,
      email: email,
      role: role,
      isDeleted: isDeleted,
      categoryId: categoryId
    }
  });

  return newAuthor
}

export async function createCategory(prisma, type, management_min, isDeleted) {
  const newCategory = await prisma.category.create({
    data: {
      type: type,
      management_min: management_min,
      isDeleted: isDeleted
    }
  });

  return newCategory
}

export async function createBook(prisma, title, userList, isDeleted) {
  for (const element of userList) {
    if (!element.id || validateInput("id", element.id).length > 0) {
      console.log("incorrect user list - it needs to be a list of {'id': actual_id}")
      return; 
    }
  }

  const newBook = await prisma.book.create({
    data: {
      title: title,
      users: {
        connect: userList
      },
      isDeleted: isDeleted
    }
  })

  return newBook
}

export async function createBookstore(prisma, name, isDeleted) {
  const newBookstore = await prisma.bookstore.create({
    data: {
      name: name,
      isDeleted: isDeleted
    }
  })

  return newBookstore;
}

export async function createInventory(
  prisma, 
  bookId, 
  bookstoreId,
  initial, 
  current,
  isDeleted,
  returns,
  givenToAuthor,
) {
  const newInventory = await prisma.inventory.create({
    data: {
      bookId: bookId,
      bookstoreId: bookstoreId,
      initial: initial,
      current: current,
      isDeleted: isDeleted,
      returns: returns,
      givenToAuthor: givenToAuthor
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
      updatedAt: updatedAt
    }
  })

  return newPayment;
}

export async function createSale(
  prisma, 
  inventoryId, 
  paymentsIdList, 
  quantity, 
  {isDeleted = false, date = new Date()} = {}
) {
  for (const element of paymentsIdList) {
    if (!element.id || validateInput("id", element.id).length > 0) {
      console.log("incorrect payments id list - it needs to be a list of {'id': actual_id}")
      return; 
    }
  }

  const newSale = await prisma.sale.create({
    data: {
      inventoryId: inventoryId,
      payments: {
        connect: paymentsIdList
      },
      quantity: quantity,
      isDeleted: isDeleted,
      date: date
    }
  })

  return newSale;
}

export async function createKindleSale(
  prisma, 
  bookId, 
  paymentsIdList, 
  quantityEbook, 
  quantityPod, 
  dateCut, 
  datePay,
  regalias
) {
  for (const element of paymentsIdList) {
    if (!element.id || validateInput("id", element.id).length > 0) {
      console.log("incorrect payments id list - it needs to be a list of {'id': actual_id}")
      return; 
    }
  }

  const newKindleSale = await prisma.kindleSale.create({
    data: {
      bookId: bookId,
      payments: {
        connect: paymentsIdList
      },
      quantityEbook: quantityEbook,
      quantityPod: quantityPod,
      dateCut: dateCut,
      datePay: datePay,
      regalias: regalias
    }
  })

  return newKindleSale
}

export async function createImpression(
  prisma, 
  bookId, 
  quantity, 
  {isDeleted=false, note=null, date=new Date()} = {}
) {
  const newImpression = await prisma.impression.create({
    data: {
      bookId: bookId,
      quantity: quantity,
      isDeleted: isDeleted,
      note: note,
      date: date
    }
  })

  return newImpression
}

export async function createTransfer(
  prisma,
  fromInventoryId,
  quantity,
  {
    toInventoryId=null,
    type="send",
    note=null,
    deliveryDate=null,
    place=null,
    person=null,
    isDeleted=false
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
      isDeleted: isDeleted
    }
  });

  return newTransfer;
}

export async function createCost(prisma, paymentId, bookId, amount) {
  const newCost = await prisma.cost.create({
    data: {
      paymentId: paymentId,
      bookId: bookId,
      amount: amount
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
    console.error(`Failed to delete ${element}`, error);
  }
}