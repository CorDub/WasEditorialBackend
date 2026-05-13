import express from "express";
import addAuthor from "./addAuthor.js";
import addMultipleAuthors from "./addMultipleAuthors.js";
import deleteAuthor from "./deleteAuthor.js";
import getAuthors from "./getAuthors.js";
import updateAuthor from "./updateAuthor.js";

const router = express.Router();

router.use(addAuthor);
router.use(addMultipleAuthors);
router.use(deleteAuthor);
router.use(getAuthors);
router.use(updateAuthor);

export default router;