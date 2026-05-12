import express from "express";
import addBook from "./addBook.js";
import addMultipleBooks from "./addMultipleBooks.js";
import deleteBook from "./deleteBook.js";
import getBooks from "./getBooks.js";
import getExistingBookTitles from "./getExistingBookTitles.js";
import updateBook from "./updateBook.js";
import updateBookPrices from "./updateBookPrices.js";

const router = express.Router();

router.use(addBook);
router.use(addMultipleBooks);
router.use(deleteBook);
router.use(getBooks);
router.use(getExistingBookTitles);
router.use(updateBook);
router.use(updateBookPrices);

export default router;