import dotenv from "dotenv";
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import userRoutes from './routes/userRoutes.js';
import { prisma } from "./prisma/client.js"
import adminRoutes from "./routes/adminRoutes.js";
// import adminRoutes from "./routes/admin/adminIndex.js";
import newInventoriesByBookstoreRoute from "./routes/admin/inventories/getInventoriesByBookstores.js";
import newInventoriesByBookRoute from "./routes/admin/inventories/getInventoriesByBook.js";
import newBookstoreInventoryRoute from "./routes/admin/inventories/getBookstoreInventory.js";
import newBookInventoryRoute from "./routes/admin/inventories/getBookInventories.js";
import newAddTransferRoute from "./routes/admin/transfers/addTransfers.js";
import authorRoutes from "./routes/authorRoutes.js";
import newGetAuthorInventoriesRoute from "./routes/author/inventories/getAuthorInventories.js";
import newGetCompleteInventoryRoute from "./routes/author/inventories/getCompleteInventory.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();

// Middleware

const allowedOrigins = [
  "https://plataformawaseditorialstaging.onrender.com",
  "https://waseditorialbackend.onrender.com",
  "http://localhost:5173"
]
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const isStaging = process.env.NODE_ENV === "staging"

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: isStaging,
    sameSite: isStaging ? "none" : "lax"
  }
}));

app.get(`/checkPermissions`, authenticateUser, async (req, res) => {
  try {
    const user_clean = {
      id: req.user.id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      country: req.user.country,
      referido: req.user.referido,
      email: req.user.email,
      categoryId: req.user.categoryId,
      role: req.user.role,
      font_size: req.user.font_size,
      phone: req.user.phone
    }
    res.status(200).json(user_clean)
  } catch(error) {
    console.log("Error running checkPermissions in userRoutes:", error);
    res.status(500).json({error: "Error in checkPermissions"});
  }
})

async function authenticateUser(req, res, next) {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized"});
  }

  const user = await prisma.user.findUnique({where: {id: req.session.user_id}});
  if (user === null) {
    return res.status(401).json({ error: "User not found"});
  } else {
    req.user = user;
    next();
  };
}

async function authenticateAdmin(req, res, next) {
  if (!req.session.user_id) {
    console.log("No user session");
    return res.status(401).json({ error: "Unauthorized"});
  }

  const user = await prisma.user.findUnique({where: {id: req.session.user_id}});
  if (user === null || (user.role !== "admin" && user.role !== "superadmin")) {
    return res.status(401).json({ error: "User not found or unauthorized"});
  } else {
    req.user = user;
    next();
  };
}

async function authenticateSuperAdmin(req, res, next) {
  if (!req.session.user_id) {
    console.log("No user session");
    return res.status(401).json({ error: "Unauthorized"});
  }

  const user = await prisma.user.findUnique({where: {id: req.session.user_id}});
  if (user === null || user.role !== "superadmin") {
    return res.status(401).json({ error: "User not found or unauthorized"});
  } else {
    req.user = user;
    next();
  };
}

//Routes
app.use('/api/author', authenticateUser, authorRoutes);
app.use('/api/author', authenticateUser, newGetAuthorInventoriesRoute);
app.use('/api/author', authenticateUser, newGetCompleteInventoryRoute);
app.use('/api/admin', authenticateAdmin, adminRoutes);
app.use('/api/admin', authenticateAdmin, newInventoriesByBookstoreRoute);
app.use('/api/admin', authenticateAdmin, newInventoriesByBookRoute);
app.use('/api/admin', authenticateAdmin, newBookstoreInventoryRoute);
app.use('/api/admin', authenticateAdmin, newBookInventoryRoute);
app.use('/api/admin', authenticateAdmin, newAddTransferRoute);
app.use('/api/superadmin', authenticateSuperAdmin, superAdminRoutes);
app.use("/api/user", userRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on ${PORT}`);
});
