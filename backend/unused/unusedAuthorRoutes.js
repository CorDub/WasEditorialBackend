// export async function getAuthorBooks (req, res) {
//   try {
//     const books = await prisma.book.findMany({
//         where: {
//             users: {
//                 some: { id: req.session.user_id }
//             },
//             isDeleted: false
//         }
//     });

import { prisma } from "../prisma/client";
import { calculateAuthorRevenue, generateMonthKeysForRange, getForMonth } from "../utils";

//     res.status(200).json(books);
//   } catch (error) {
//       console.error(error);
//     res.status(500).send("Server error");
//   }
// }
// router.get('/books', getAuthorBooks);


// export async function getAuthorInventoriesbyBook (req, res) {
//   try {
//     if (!req.session.user_id) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const book = await prisma.book.findFirst({
//       where: {
//         id: parseInt(req.params.bookId),
//         users: {
//           some: { id: req.session.user_id }
//         },
//         isDeleted: false
//       }
//     });

//     if (!book) {
//       return res.status(404).json({ message: "Book not found or access denied" });
//     }

//     const inventories = await prisma.inventory.findMany({
//       where: { bookId: parseInt(req.params.bookId) },
//       include: {
//         sales: true
//       }
//     });

//     const initialTotal = inventories.reduce((sum, inv) => sum + inv.initial, 0);
//     const soldTotal = inventories.reduce((sum, inv) => {
//       const itemSales = inv.sales?.reduce((salesSum, sale) => salesSum + sale.quantity, 0) || 0;
//       return sum + itemSales;
//     }, 0);
//     const remainingTotal = initialTotal - soldTotal;

//     res.status(200).json({
//       inventories,
//       summary: {
//         initial: initialTotal,
//         sold: soldTotal,
//         total: remainingTotal
//       }
//     });
//   } catch(error) {
//     console.error("Error in the get inventories route:", error);
//     res.status(500).json({error: 'A server error occurred while fetching inventories'});
//   }
// }
// router.get('/books/:bookId/inventories', getAuthorInventoriesbyBook)


// export async function getAuthorSalesPerMonth(req, res) {
//   try {
//     // Get the last twelfth month first day as a cutoff date
//     const ltm = new Date();
//     ltm.setMonth(ltm.getMonth()-12);
//     ltm.setDate(1);

//     // Get all sales for that user based on that;
//     const data = await prisma.sale.findMany({
//       where: {
//         inventory: {
//           book: {
//             users: {
//               some: {
//                 id: req.session.user_id
//               }
//             },
//             isDeleted: false
//           },
//           bookstore: {
//             isDeleted: false
//           }
//         },
//         isDeleted: false,
//         createdAt: {
//           gt: ltm
//         }
//       }, 
//       select: {
//         id: true,
//         quantity: true,
//         createdAt: true,
//         inventory: {
//           select: {
//             bookstore: {
//               select: {
//                 name: true,
//                 comissions: true,
//                 deal_percentage: true
//               }
//             },
//             book: {
//               select: {
//                 id: true,
//                 title: true,
//               }
//             },
//             price: true
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     const user = await prisma.user.findUnique({
//       where: {
//         id: req.session.user_id
//       }
//     });
//     const userCategory = await prisma.category.findUnique({
//       where: {
//         id: user.categoryId
//       }
//     });

//     // Preparing a 'scaffold' to reuse later, basically empty models
//     let bookstores = await prisma.bookstore.findMany({
//       where: {
//         isDeleted: false
//       },
//       select: {
//         id: true,
//         name: true,
//       }
//     });

//     // Adding quantity to the scaffold
//     for (const bookstore of bookstores) {
//       bookstore["quantity"] = 0;
//     }

//     // Ensuring sales are grouped by month.
//     let salesByMonths = {};
//     let numberOfAuthors = {};
//     for (const sale of data) {
//       const date = new Date(sale.createdAt);
//       const year = date.getFullYear();
//       const month = (date.getMonth() +1).toString().padStart(2, "0");
//       const key = `${year}-${month}`;
//       if (!numberOfAuthors[sale.inventory.book.id]) {
//         const authorCount = await prisma.book.findUnique({
//           where: {id: sale.inventory.book.id},
//           select: {
//             _count: {
//               select: {users: true}
//             }
//           }
//         });
//         numberOfAuthors[sale.inventory.book.id] = authorCount._count.users;
//       }

//       // console.log("")
//       // console.log("sale.inventory.bookstore.comissions", sale.inventory.bookstore.comissions)
//       // console.log("sale.inventory.price ", sale.inventory.price )
//       // console.log("userCategory.management_min", userCategory.management_min)
//       // console.log("sale.inventory.bookstore.deal_percentage", sale.inventory.bookstore.deal_percentage)
//       // console.log("sale.quantity", sale.quantity)

//       if (salesByMonths[key]) {
//         salesByMonths[key]["sales"].push({...sale, 
//           comissions: sale.inventory.bookstore.comissions
//             ? userCategory.management_min
//             : sale.inventory.price 
//               * (sale.inventory.bookstore.deal_percentage / 100)
//           //     * (userCategory.percentage_royalties / 100),
//           // sharePerAuthor: (1/numberOfAuthors[sale.inventory.book.id] * 100).toFixed(2) + " %"
//         });
        
//         // console.log("comissions", salesByMonths[key]["sales"]);

//         salesByMonths[key]["total"] += calculateAuthorRevenue(
//           sale.inventory.bookstore.comissions,
//           sale.inventory.price,
//           userCategory.management_min,
//           sale.inventory.bookstore.deal_percentage,
//           sale.quantity,
//         )
//       } else {
//         salesByMonths[key] = {
//           sales: [{...sale, 
//           comissions: sale.inventory.bookstore.comissions
//             ? userCategory.management_min
//             : sale.inventory.price 
//               * (sale.inventory.bookstore.deal_percentage / 100)
//               // * (userCategory.percentage_royalties / 100),
//           // sharePerAuthor: (1/numberOfAuthors[sale.inventory.book.id] * 100).toFixed(2) + " %"
//         }],
//           ganancia: (
//             sale.inventory.bookstore.comissions 
//               ? (sale.inventory.price - userCategory.management_min)
//                 // / numberOfAuthors[sale.inventory.book.id]
//               : sale.inventory.price
//                 * (sale.inventory.bookstore.deal_percentage / 100)
//                 // * (userCategory.percentage_royalties / 100)
//                 // / numberOfAuthors[sale.inventory.book.id]
//           ),
//           total: calculateAuthorRevenue(
//               sale.inventory.bookstore.comissions,
//               sale.inventory.price,
//               userCategory.management_min,
//               sale.inventory.bookstore.deal_percentage,
//               sale.quantity,
//             ),
//           // deep cloning the bookstores to avoid having the same object being mutated later
//           // and shared across different months instead of a different object every time
//           transfers: bookstores.map(bookstore => ({...bookstore})),
//           transfersTotal: 0
//         }
//       }
//     }

//     /// Adding transfers for the "entregado" column - same process
//     // Get all the transfers from the last 12 months
//     const allAuthorTransfers = await prisma.transfer.findMany({
//       where: {
//         isDeleted: false,
//         fromInventory: {
//           book: {
//             users: {
//               some: {
//                 id: req.session.user_id
//               }
//             }
//           }
//         },
//         createdAt: {
//           gte: ltm
//         }
//       },
//       select: {
//         id: true,
//         quantity: true,
//         createdAt: true,
//         toInventory: {
//           select: {
//             bookstore: {
//               select: {
//                 id: true,
//                 name: true
//               }
//             }
//           }
//         }
//       }
//     });

//     // Then add the transfer data to salesBymonth if the month of the transfer exist
//     // Otherwise create it
//     if (allAuthorTransfers.length > 0) {
//       for (const transfer of allAuthorTransfers) {
//         const transferMonth = getForMonth(transfer.createdAt);

//         if (!salesByMonths[transferMonth]) {
//           salesByMonths[transferMonth] = {
//             sales: [],
//             ganancia: 0,
//             total: 0,
//             // deep cloning the bookstores to avoid having the same object being mutated later
//             // and shared across different months instead of a different object every time
//             transfers: bookstores.map(bookstore => ({...bookstore})),
//             transfersTotal: 0,
//           }
//         };

//         for (const bookstore of salesByMonths[transferMonth]['transfers']) {
//           // skip deliveries to author
//           if (transfer.toInventory === null) {
//             // bookstore.quantity += transfer.quantity;
//             continue;
//           }
//           if (bookstore.id === transfer.toInventory.bookstore.id) {
//             bookstore.quantity += transfer.quantity
//           }
//         }
//         salesByMonths[transferMonth]["transfersTotal"] += transfer.quantity
//       }
//     }

//     // Fill in the missing months with phantom data (0s) so that it will display
//     // correctly with the month chosen (based on index)

//     let salesByMonthsList = Object.entries(salesByMonths);
//     let newSalesByMonthsList = [];
//     // Get the YYYY-MM combination 12m ago
//     const now = new Date();
//     let currentYear = now.getFullYear();
//     const currentMonth = now.getMonth() + 1;

//     // Get an array of all the 12 monhts Y + M combination
//     let ltmStrings = [];
//     for (let i = 0; i < 13; i++) {
//       const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
//       const monthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
//       ltmStrings.push(monthStr);
//     }

//     for (let i = 0; i < ltmStrings.length; i++) {
//       let existing = false;

//       for (const month of salesByMonthsList) {
//         if (ltmStrings[i] === month[0]) {
//           newSalesByMonthsList.push(month);
//           existing = true;
//           continue;
//         }
//       }

//       if (!existing) {
//         newSalesByMonthsList.push([
//           ltmStrings[i], {
//             ganancia: 0,
//             sales: [],
//             total: 0,
//             transfers: [],
//             transfersTotal: 0
//           }
//         ])
//       }
//     }

//     res.status(200).json(newSalesByMonthsList);
//   } catch (error) {
//     console.error("error fetching monthly sales", error);
//     res.status(500).json({error: 'Internal server error'});
//   }
// } 
// router.get('/monthlySales', getAuthorSalesPerMonth)


// export async function getCurrentTienda (req, res) {
//   try {
//     const month = req.query.month;

//     let monthDateTime;
//     if (parseInt(month.substring(5,7)) === 12) {
//       monthDateTime = new Date(`${parseInt(month.substring(0,4))+1}-01-01`)
//     } else {
//       const nextMonth = parseInt(month.substring(5,7)) + 1
//       monthDateTime = new Date(`${month.substring(0,4)}-${nextMonth}-01`);
//     }

//     const inventories = await prisma.inventory.findMany({
//       where: {
//         isDeleted: false,
//         createdAt: {
//           lt: monthDateTime
//         },
//         book: {
//           users: {
//             some: {
//               id: req.session.user_id
//             }
//           }
//         }
//       },
//       include: {
//         bookstore: {
//           select: {
//             id: true,
//             name: true
//           },
//         },
//         sales: {
//           where: {
//             isDeleted: false
//           }
//         },
//         transfersFrom: {
//           where: {
//             isDeleted : false
//           }
//         },
//         transfersTo: {
//           where: {
//             isDeleted : false
//           }
//         },
//       }
//     });

//     let inventoriesReconstructed = [];
//     for (const inventory of inventories) {
//       let existing = false;

//       for (const obj of inventoriesReconstructed) {
//         if (obj.id === inventory.bookstore.id) {
//           obj.total += inventory.initial,
//           obj.current += inventory.current

//           for (const transfer of inventory.transfersFrom) {
//             if (transfer.createdAt >= monthDateTime) {
//               obj.current += transfer.quantity
//               obj.initial += transfer.quantity
//             }
//           };

//           for (const sale of inventory.sales) {
//             if (sale.createdAt >= monthDateTime) {
//               obj.current += sale.quantity
//             }
//           };

//           for (const transfer of inventory.transfersTo) {
//             if (transfer.createdAt > monthDateTime) {
//               obj.current -= transfer.quantity
//               obj.initial -= transfer.quantity
//             }
//           }

//           existing = true;
//           break;
//         }
//       }

//       if (!existing) {
//         let tbp = {
//           name: inventory.bookstore.name,
//           total: inventory.initial,
//           current: inventory.current
//         };

//         // initial should be more appropriately renamed to total
//         for (const transfer of inventory.transfersFrom) {
//           if (transfer.createdAt >= monthDateTime) {
//             tbp.current += transfer.quantity
//             tbp.initial += transfer.quantity
//           }
//         };

//         for (const sale of inventory.sales) {
//           if (sale.createdAt >= monthDateTime) {
//             tbp.current += sale.quantity
//           }
//         };

//         for (const transfer of inventory.transfersTo) {
//           if (transfer.createdAt >= monthDateTime) {
//             tbp.current -= transfer.quantity
//             tbp.initial -= transfer.quantity
//           }
//         };

//         inventoriesReconstructed.push(tbp);
//       }
//     }

//     let groupedTiendaData = inventoriesReconstructed.reduce((groupedByTienda, {name, total, current}) => {
//       if (!groupedByTienda[name]) {
//         groupedByTienda[name] = { name, total: 0, current: 0};
//       }
//       groupedByTienda[name].total += total;
//       groupedByTienda[name].current += current;
//       return groupedByTienda;
//     }, {});

//     const groupedTiendaDataList = Object.values(groupedTiendaData);

//     res.status(200).json(groupedTiendaDataList);
//   } catch (error) {
//     console.log("\n ERROR PROVIDING RELEVANT INVENTORIES \n",error);
//     res.status(500).json({error: "There was a server error fetching the relevant data"});
//   };
// }
// router.get('/currentTienda', getCurrentTienda)


// export async function getGivenToAuthorsTransfers (req, res) {
//   const currentUserId = req.session.user_id;
//   try {
//     const relevantTransfers = await prisma.transfer.findMany({
//       where: {
//         isDeleted: false,
//         type: 'send',
//         toInventoryId: null,
//         fromInventory: {
//           book: {
//             users: {
//               some: {
//                 id: currentUserId
//               }
//             }
//           }
//         }
//       },
//       select: {
//         id: true,
//         quantity: true,
//         note: true,
//         deliveryDate: true,
//         place: true,
//         person: true,
//         fromInventory: {
//           select: {
//             book: {
//               select: {
//                 title: true,
//                 id: true
//               }
//             }
//           }
//         }
//       },

//     })

//     res.status(200).json(relevantTransfers);
//   } catch (error) {
//     console.log("\n ERROR FETCHING RELEVENT TRANSFERS FROM SERVER \n", error);
//     res.status(500).json({error: "a server error occurred while fetching relevant transfers"});
//   }
// };
// router.get('/givenToAuthorTransfers', getGivenToAuthorsTransfers);

// export async function getAuthorBookstoreInventories(req, res) {
//   try {
//     const bookId = parseInt(req.params.id);
//     // fetch all inventories from the author

//     let relevantInventories;
//     if (bookId) {
//       relevantInventories = await prisma.inventory.findMany({
//         where: {
//           isDeleted: false,
//           bookId: bookId
//         },
//         select: {
//           id: true,
//           book: {
//             select: {
//               title: true
//             }
//           },
//           bookId: true,
//           bookstore: {
//             select: {
//               name: true,
//               color: true
//             }
//           },
//           bookstoreId: true,
//           current: true
//         }
//       });
//     } else {
//       relevantInventories = await prisma.inventory.findMany({
//         where: {
//           isDeleted: false,
//           book: {
//             users: {
//               some: {
//                 id: req.session.user_id
//               }
//             }
//           }
//         },
//         select: {
//           id: true,
//           book: {
//             select: {
//               title: true
//             }
//           },
//           bookId: true,
//           bookstore: {
//             select: {
//               name: true,
//               color: true
//             }
//           },
//           bookstoreId: true,
//           current: true
//         }
//       });
//     }

//     // group the results by bookstore and books
//     let relevantInventoriesByBookstore = {};
//     let relevantInventoriesByBook = {};

//     for (const inventory of relevantInventories) {
//       // grouping by bookstores
//       if (relevantInventoriesByBookstore.hasOwnProperty(inventory.bookstoreId)) {
//         relevantInventoriesByBookstore[inventory.bookstoreId].current += inventory.current
//       } else {
//         /// 1 = BookstoreId of Plataforma Was that we'll be excluding here.
//         if (inventory.bookstoreId !== 1) {
//           relevantInventoriesByBookstore[inventory.bookstoreId] = {
//             name: inventory.bookstore.name,
//             current: inventory.current,
//             color: inventory.bookstore.color,
//             title: inventory.book.title
//           }
//         }
//       };

//       // grouping by book and populating summary
//       if (relevantInventoriesByBook.hasOwnProperty(inventory.bookId)) {
//         relevantInventoriesByBook[inventory.bookId].summary += inventory.current;
//         if (relevantInventoriesByBook[inventory.bookId].hasOwnProperty(inventory.bookstoreId)) {
//           relevantInventoriesByBook[inventory.bookId][inventory.bookstoreId].current += inventory.current
//         } else {
//           relevantInventoriesByBook[inventory.bookId][inventory.bookstoreId] = {
//             bookstoreName: inventory.bookstore.name,
//             current: inventory.current,
//             color: inventory.bookstore.color
//           }
//         }
//       } else {
//         relevantInventoriesByBook[inventory.bookId] = {
//           title: inventory.book.title,
//           [inventory.bookstoreId] : {
//             bookstoreName : inventory.bookstore.name,
//             current: inventory.current
//           },
//           summary: inventory.current,
//           color: inventory.bookstore.color
//         }
//       }
//     }

//     res.status(200).json({
//       "inventoriesByBookstores" : relevantInventoriesByBookstore,
//       "inventoriesByBook": relevantInventoriesByBook
//     });
//   } catch (error) {
//     console.log("\n ERROR FETCHING RELEVANT INVENTORIES FROM SERVER \n", error);
//     res.status(500).json({error: "a server error occured while fetching relevant inventories"});
//   }
// }
// router.get('/bookstoreInventories/:id', getAuthorBookstoreInventories);


// export async function getWasInventories(req, res) {
//   try {
//     // fetch all was inventories from the author
//     const relevantInventories = await prisma.inventory.findMany({
//       where: {
//         isDeleted: false,
//         book: {
//           users: {
//             some: {
//               id: req.session.user_id
//             }
//           }
//         },
//         bookstoreId: 3
//       },
//       select: {
//         id: true,
//         book: {
//           select: {
//             title: true
//           }
//         },
//         bookId: true,
//         bookstore: {
//           select: {
//             name: true,
//           }
//         },
//         bookstoreId: true,
//         current: true
//       }
//     });

//     let relevantInventoriesByBook = {};

//     for (const inventory of relevantInventories) {
//       if (relevantInventoriesByBook.hasOwnProperty(inventory.bookId)) {
//         relevantInventoriesByBook[inventory.bookId].current += inventory.current
//       } else {
//         relevantInventoriesByBook[inventory.bookId] = {
//           title: inventory.book.title,
//           current: inventory.current
//         }
//       }
//     }

//     res.status(200).json(relevantInventoriesByBook);
//   } catch (error) {
//     console.log('\n ERROR WHILE FETCHING THE WAS INVENTORIES FROM SERVER \n', error);
//     res.status(500).json({error: "a server error occured while fetching relevant inventories"});
//   }
// }
// router.get("/wasInventories", getWasInventories);


// export async function getAuthorCosts(req, res) {
//   const paymentIdQuery = parseInt(req.params.id);
//   try {
//     const fetchedCosts = await prisma.cost.findMany({
//       where: {
//         paymentId: paymentIdQuery,
//         isDeleted: false,
//         payment: {
//           userId: req.session.user_id
//         }
//       },
//       select: {
//         id: true,
//         note: true,
//         amount: true
//       }
//     });

//     if (fetchedCosts) {
//       res.status(200).json(fetchedCosts);
//     }
//   } catch(error) {
//     console.log("\n ERROR WHILE FETCHING COSTS FROM THE SERVER \n", error);
//     res.status(500).json({error: "a server error occurred while fetching costs."})
//   }
// }
// router.get("/costs/:id", getAuthorCosts);


// export async function getAuthorBookInventories(req, res) {
//   try {
//     if (!req.session.user_id) {
//       return res.status(401).json({message: 'Unauthorized'})
//     }

//     const inputs = {
//       bookId: parseInt(req.params.id)
//     }
//     validateInputs(inputs);

//     // Get all inventories for that specific book
//     const bookInventories = await prisma.inventory.findMany({
//       where: {
//         bookId: inputs.bookId,
//         isDeleted: false
//       },
//       select: {
//         id: true,
//         bookstoreId: true,
//         bookstore: {
//           select: {
//             name: true,
//             // color: true
//           }
//         },
//         book: {
//           select: {
//             title: true
//           }
//         },
//         initial: true,
//         current: true,
//         returns: true,
//         givenToAuthor: true
//       }
//     });

//     // Group by bookstore
//     let groupedByBookstore = {}
//     // create the object if it doesn't exist, add things if it does
//     for (const inventory of bookInventories) {
//       if (inventory.bookstore.name in groupedByBookstore) {
//         groupedByBookstore[inventory.bookstore.name].initial += inventory.initial;
//         groupedByBookstore[inventory.bookstore.name].current += inventory.current;
//         if (inventory.bookstoreId !== 1) {
//           groupedByBookstore[inventory.bookstore.name].returns += inventory.returns;
//         } else {
//           groupedByBookstore[inventory.bookstore.name].given += inventory.givenToAuthor;
//         }
//       } else {
//         groupedByBookstore[inventory.bookstore.name] = {
//           bookstoreId: inventory.bookstoreId,
//           name: inventory.bookstore.name,
//           title: inventory.book.title,
//           initial: inventory.initial,
//           current: inventory.current,
//         }
//         if (inventory.bookstoreId !== 1) {
//           groupedByBookstore[inventory.bookstore.name].returns += inventory.returns;
//         } else {
//           groupedByBookstore[inventory.bookstore.name].given += inventory.givenToAuthor;
//         }
//       }
//     }

//     res.status(200).json(Object.values(groupedByBookstore));
//   } catch (error) {
//     console.log("\n ERROR WHILE FETCHING THE BOOK INVENTORIES FROM SERVER \n", error);
//     res.status(500).json({error: "a server error occurred while fetching relevant book inventories"});
//   }
// }
// router.get("/bookInventories/:id", getAuthorBookInventories)


// export async function getAuthorPayments (req, res) {
//   try {
//     if (!req.session.user_id) {
//       return res.status(401).json({message: "Unauthorized"})
//     }

//     // Getting our range ready by setting it 12m ago
//     const ltm = new Date();
//     ltm.setMonth(ltm.getMonth()-12);
//     ltm.setDate(1);

//     // Getting all payments from that date to now
//     const allPayments = await prisma.payment.findMany({
//       where: {
//         isDeleted: false,
//         userId: req.session.user_id,
//         createdAt: {
//           gt: ltm
//         }
//       },
//       include: {
//         sales: true,
//         kindleSales: true,
//         costs: true
//       },
//       orderBy: {
//         createdAt: "desc"
//       }
//     });

//     const userWithCategory = await prisma.user.findUnique({
//       where: {
//         id: req.session.user_id
//       },
//       include: {
//         category: true
//       }
//     })

//     // Fill in empty months with 0s if necessary
//     if (allPayments.length < 13) {
//       // Get the YYYY-MM combination 12m ago
//       const now = new Date();
//       let currentYear = now.getFullYear();
//       const currentMonth = now.getMonth() + 1;

//       // Get an array of all the 12 monhts Y + M combination
//       let ltmStrings = [];
//       for (let i = 0; i < 12; i++) {
//         let monthString = "";
//         if ((currentMonth - i) <= 0) {
//           let newCurrentMonth = currentMonth - i + 12;
//           if (newCurrentMonth.toString().length === 1) {
//             newCurrentMonth = "0" + newCurrentMonth.toString();
//           } else {
//             newCurrentMonth = newCurrentMonth.toString();
//           }

//           monthString = (currentYear - 1).toString() + '-' + newCurrentMonth;
//         } else {
//           let newCurrentMonth = (currentMonth-i).toString();
//           if (newCurrentMonth.toString().length === 1) {
//             newCurrentMonth = "0" + newCurrentMonth.toString();
//           } else {
//             newCurrentMonth = newCurrentMonth.toString();
//           }

//           monthString = currentYear.toString() + '-'+ newCurrentMonth;
//         }
//         ltmStrings.push(monthString);
//       }

//       // Compare with allPayments and fill in if missing
//       for (let i = 0; i < ltmStrings.length; i++) {
//         let existing = false;

//         for (const payment of allPayments) {
//           if (ltmStrings[i] === payment.forMonth) {
//             existing = true;
//           }
//         }

//         if (!existing) {
//           allPayments.splice(i, 0, {
//             forMonth: ltmStrings[i],
//             status: "created",
//             // sales: [],
//             // kindleSales: [],
//             // costs: []
//           });
//         }
//       };
//     }

//     //Calculate and add the total amount of each payment
//     for (const payment of allPayments) {
//       payment.amount = 0;
//       // sales
//       if (payment.sales.length > 0) {
//         for (const sale of payment.sales) {
//           const saleInventory = await prisma.inventory.findUnique({
//             where:{
//               id: sale.inventoryId
//             },
//             include: {
//               bookstore: true
//             }
//           })

//           payment.amount += calculateAuthorRevenue(
//             saleInventory.bookstore.comissions,
//             saleInventory.price,
//             userWithCategory.category.management_min,
//             saleInventory.bookstore.deal_percentage,
//             sale.quantity
//           )
//         }
//       }

//       //kindleSales
//       if (payment.kindleSales.length > 0) {
//         for (const sale of payment.kindleSales) {
//           if (!sale.isDeleted) {
//             payment.amount += sale.regalias
//           }
//         }
//       }

//       //costs
//       if (payment.costs.length > 0) {
//         for (const cost of payment.costs) {
//           payment.amount -= cost.amount
//         }
//       }
//     }

//     res.status(200).json(allPayments);
//   } catch(error) {
//     console.log("\n ERROR WHILE FETCHING PAYMENTS FROM SERVER \n", error);
//     res.status(500).json({error: "a server error occurred while fetching relevant transfers"})
//   }
// }