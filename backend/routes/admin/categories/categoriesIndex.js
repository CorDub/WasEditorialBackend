import express from "express";
import addCategory from "./addCategory.js";
import deleteCategory from "./deleteCategory.js";
import getCategories from "./getCategories.js";
import getImpactedBooks from "./getImpactedBooks.js";
import updateCategory from "./updateCategory.js";

const router = express.Router();

router.use(addCategory);
router.use(deleteCategory);
router.use(getCategories);
router.use(getImpactedBooks);
router.use(updateCategory);

export default router;