import express from "express";
import addBookstore from "./addBookstore.js";
import deleteBookstore from "./deleteBookstore.js";
import getBookstores from "./getBookstores.js";
import getExistingBookstoreNames from "./getExistingBookstoreNames.js";
import updateBookstore from "./updateBookstore.js";

const router = express.Router();

router.use(addBookstore);
router.use(deleteBookstore);
router.use(getBookstores);
router.use(getExistingBookstoreNames);
router.use(updateBookstore);

export default router;