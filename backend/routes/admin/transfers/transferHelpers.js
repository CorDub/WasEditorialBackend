export function findEarliestDeliveryToAuthor(inventory) {
  if (!inventory.transfersFrom || inventory.transfersFrom.length === 0) {
    throw new Error("No transfers From in inventory provided.")
  }

  let earliest = null;
  for (const transfer of inventory.transfersFrom) {
    if (transfer.isDeleted) {
      continue
    }

    // return to library - not a delivery to author
    if (transfer.toInventoryId) {
      continue
    }

    if (earliest === null) {
      earliest = transfer.dateStr
      continue
    }

    if (transfer.dateStr < earliest) {
      earliest = transfer.dateStr
    }
  }

  if (earliest === null) {
    throw new Error("No active delivery to author found for this inventory")
  }

  return earliest
}



export function findEarliestReturnFromAuthor(inventory) {
  if (!inventory.transfersTo || inventory.transfersTo.length === 0) {
    throw new Error("Could not parse inventory provided to find earliest return to author")
  }

  let earliest = null;
  for (const transfer of inventory.transfersTo) {
    if (transfer.isDeleted) {
      continue
    }

    // send from library - not a return from author
    if (transfer.toInventoryFrom) {
      continue
    }

    if (earliest === null) {
      earliest = transfer.dateStr
      continue
    }

    if (transfer.dateStr < earliest) {
      earliest = transfer.dateStr
    }
  }

  if (earliest === null) {
    throw new Error("No active return from author found for this inventory")
  }

  return earliest
}



export function checkSendReturnOrder(inventory, transferToBeEdited, typeTBE) {
  //get all relevant trnasfers and impressions
  let allTransfers = []

  for (const transfer of inventory.transfersTo) {
    if (transfer.isDeleted) {
      continue
    }

    if (transfer.id === transferToBeEdited.id) {
      continue
    }

    // not a return
    if (!transfer.fromInventoryId) {
      continue
    }

    if (inventory.bookstoreId === 1) {
      allTransfers.push({...transfer, type: "return" })
    } else {
      allTransfers.push({...transfer, type: "send" })
    }
  }

  for (const transfer of inventory.transfersFrom) {
    if (transfer.isDeleted) {
      continue
    }

    if (transfer.id === transferToBeEdited.id) {
      continue
    }

    // not a send
    if (!transfer.toInventoryId) {
      continue
    }

    if (inventory.bookstoreId === 1) {
      allTransfers.push({...transfer, type: "send" })
    } else {
      allTransfers.push({...transfer, type: "return" })
    }
  }

  // console.log("inventory.bookstoreId", inventory.bookstoreId)
  // if (inventory.bookstoreId === 1 && inventory.book.impressions) {
  //   for (const impression of inventory.book.impressions) {
  //     allTransfers.push({...impression, type: "impression" })
  //   }
  // }

  allTransfers.push({...transferToBeEdited, type: typeTBE})

  //sort
  allTransfers.sort((a, b) => {
    if (a.dateStr < b.dateStr) {
      return -1
    } else if (a.dateStr > b.dateStr) {
      return 1
    }

    // if equals
    // let precedence;
    // if (inventory.bookstoreId === 1) {
    //   precedence = {
    //     // impression: 0,
    //     send: 0,
    //     return: 1,
    //   } 
    // } else {
    //   precedence = {
    //     return: 0,
    //     send: 1
    //   }
    // }
    let precedence = {
      send: 0,
      return: 1
    }
    
    return precedence[a.type] - precedence[b.type]
  })

  // check
  let current = 0;
  for (const transfer of allTransfers) {
    if (transfer.type === "impression" || transfer.type === "send") {
      current += transfer.quantity
    }

    if (transfer.type === "return") {
      current -= transfer.quantity
    }

    if (current < 0) {
      return false
    }
  }

  return true
}



export function checkDeliveryReturnOrder(inventory, transferToBeEdited, typeTBE) {
  //get all relevant transfers
  let allTransfers = []

  for (const transfer of inventory.transfersTo) {
    if (transfer.isDeleted) {
      continue
    }

    if (transfer.id === transferToBeEdited.id) {
      continue
    }

    // not a return from autor
    if (transfer.fromInventoryId) {
      continue
    }

    allTransfers.push({...transfer, type: "return" })
  }

  for (const transfer of inventory.transfersFrom) {
    if (transfer.isDeleted) {
      continue
    }

    if (transfer.id === transferToBeEdited.id) {
      continue
    }

    // not a delivery to autor
    if (transfer.toInventoryId) {
      continue
    }

    allTransfers.push({...transfer, type: "send" })
  }

  allTransfers.push({...transferToBeEdited, type: typeTBE})

  //sort
  allTransfers.sort((a, b) => {
    if (a.dateStr < b.dateStr) {
      return -1
    } else if (a.dateStr > b.dateStr) {
      return 1
    }

    // if equals
    // let precedence;
    // if (a.type === "send") {
    //   precedence = {
    //     send: 0,
    //     return: 1,
    //   } 
    // } else {
    //   precedence = {
    //     return: 0,
    //     send: 1
    //   }
    // }
    let precedence = {
      send: 0,
      return: 1
    }

    return precedence[a.type] - precedence[b.type]
  })

  // check
  let current = 0;
  for (const transfer of allTransfers) {
    if (transfer.type === "send") {
      current += transfer.quantity
    }

    if (transfer.type === "return") {
      current -= transfer.quantity
    }

    if (current < 0) {
      return false
    }
  }

  return true
}