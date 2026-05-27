export function getTotalWasImpressions(inventory) {
  let res = {
    impressionInicial: 0,
    entregadosDelAutor: 0,
    extraImpressions: 0,
  }
  
  if (inventory.book.impressions.length === 0) {
    console.error(`Impressions for this inventory were not provided. Inventory.id: ${inventory.id}`)
    return res
  }

  const impressions = inventory.book.impressions
  let inicialImpressionAssigned = false;

  for (let i= 0; i < impressions.length; i++) {
    if (impressions[i].isDeleted) {
      console.error(`There shouldn't be a deleted impression here. Impression Id: ${impressions[i].id}`)
      continue
    }

    if (!inicialImpressionAssigned) {
      res.impressionInicial += impressions[i].quantity
      inicialImpressionAssigned = true
    } else {
      if (impressions[i].authorDelivery) {
        res.entregadosDelAutor += impressions[i].quantity
      } else {
        res.extraImpressions += impressions[i].quantity
      }
    }
  }

  return res
}

export function getTotalWasTransfers(inventory) {
  let res = {
    transfers: 0,
    entregadosAlAutor: 0,
    returns: 0
  }

  if (inventory.transfersFrom.length > 0) {
    for (const transfer of inventory.transfersFrom) {
      if (transfer.isDeleted) {
        continue
      }

      if (transfer.toInventoryId != null) {
        res.transfers += transfer.quantity
      } else {
        res.entregadosAlAutor += transfer.quantity
      }
      
    }
  }
  
  if (inventory.transfersTo.length > 0) {
    for (const transfer of inventory.transfersTo) {
      if (transfer.isDeleted) {
        console.error(`Transfer is deleted`)
        continue
      }

      res.returns += transfer.quantity
    }
  }
  return res
}

export function getTotalSales(inventory) {
  let total = 0

  const sales = inventory.sales
  if (sales.length === 0) {
    return total
  }

  for (const sale of sales) {
    if (sale.isDeleted) {
      console.error(`Deleted sale should not be there, sale Id: ${sale.id}`)
      continue
    }

    total += sale.quantity
  }

  return total
}


export function getNonWasTransfers(inventory) {
  let res = {
    transferInicial: 0,
    extraTransfers: 0,
    returns: 0
  }

  if (!inventory.transfersTo || inventory.transfersTo.length === 0) {
    console.error("Missing or empty transfersTo")
    return res
  }

  //1. sort TransfersTo
  const transfersTo = inventory.transfersTo
  transfersTo.sort((a, b) => a.deliveryDate - b.deliveryDate)

  //2. loop transfersTo
  let transferInicialAssigned = false
  for (const transfer of transfersTo) {
    if (transfer.isDeleted) {
      console.error("Deleted transfer here")
      continue
    }

    if (!transferInicialAssigned) {
      res.transferInicial += transfer.quantity
      transferInicialAssigned = true
    } else {
      res.extraTransfers += transfer.quantity
    }
  }

  //3. loop transfersFrom
  for (const transfer of inventory.transfersFrom) {
    if (transfer.isDeleted) {
      console.error("Deleted transfer here")
      continue
    }

    res.returns += transfer.quantity
  }

  return res
}


export function getGivenToAuthor(inventory) {
  let res = 0

  if (!inventory.transfersFrom || inventory.transfersFrom.length === 0) {
    return res
  }

  for (const transfer of inventory.transfersFrom) {
    if (transfer.isDeleted) {
      console.error("Deleted transfer here that shouldn't happen")
      continue
    }

    if (transfer.toInventoryId == null) {
      res += transfer.quantity
    }
  }

  return res
}


export function getWasInventory(inventory) {
  let res = {
    copias: 0,
    impressionInicial: 0,
    extraImpressions: 0,
    returns: 0,
    transfers: 0,
    entregadosDelAutor: 0,
    entregadosAlAutor: 0,
    ventas: 0,
    disponibles: 0,
  }

  // step 1: impressions
  const impressionsRes = getTotalWasImpressions(inventory) 
  res.impressionInicial += impressionsRes.impressionInicial
  res.extraImpressions += impressionsRes.extraImpressions
  res.entregadosDelAutor += impressionsRes.entregadosDelAutor

  //step 2: sales
  res.ventas += getTotalSales(inventory)
  
  //step 3: transfers
  const transfersRes = getTotalWasTransfers(inventory)
  res.transfers += transfersRes.transfers
  res.entregadosAlAutor += transfersRes.entregadosAlAutor
  res.returns += transfersRes.returns

  //step 4: copias
  res.copias = 
    res.impressionInicial +
    res.extraImpressions +
    res.entregadosDelAutor -
    res.transfers

  //step5: disponible
  res.disponibles = 
    res.copias -
    res.ventas +
    res.returns -
    res.entregadosAlAutor

  return res
}


export function getOtherInventory(inventory) {
  let scaffold = {
    copias: 0,
    inicial: 0,
    extraTransfers: 0,
    returns: 0,
    ventas: 0,
    disponibles: 0,
  }

  const transferRes = getNonWasTransfers(inventory)
  scaffold.inicial += transferRes.transferInicial
  scaffold.extraTransfers += transferRes.extraTransfers
  scaffold.returns += transferRes.returns

  const salesRes = getTotalSales(inventory)
  scaffold.ventas += salesRes

  scaffold.copias = scaffold.inicial + scaffold.extraTransfers

  scaffold.disponibles = 
    scaffold.copias - 
    scaffold.returns -
    scaffold.ventas
  
  return scaffold
}

export function getEarliestInventoryDate(inventory) {
  //finds earliest non-deleted impression for WAS
  if (inventory.bookstoreId === 1) {
    const impressions = (inventory.book?.impressions || [])
      .filter(imp => !imp.isDeleted)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))

    return impressions.length > 0 ? impressions[0].dateStr : null
  }

  // finds earliest non-deleted transfer for any other
  const transfersTo = (inventory.transfersTo || [])
    .filter(t => !t.isDeleted)
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr))

  return transfersTo.length > 0 ? transfersTo[0].dateStr : null
}

export function getInventoryDerived(inventory) {
  let res; 
  if (inventory.bookstoreId === 1) {
    res = getWasInventory(inventory)
  } else {
    res = getOtherInventory(inventory)
  }

  return res
}