import express from 'express';
import cors from 'cors';
import session from 'express-session';
import userRoutes from './routes/userRoutes.js';
import { PrismaClient } from "@prisma/client";
import adminRoutes from "./routes/adminRoutes.js";
import authorRoutes from "./routes/authorRoutes.js"

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false
  }
}));

app.get('/api/checkPermissions', authenticateUser, async (req, res) => {
  try {
    res.json({user: req.user})
  } catch(error) {
    console.log("Error running checkPermissions in userRoutes:", error);
    res.status(500).json({error: "Error in checkPermissions"});
  }
})

app.use("/api", userRoutes);

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
  if (user === null || user.is_admin === false) {
    return res.status(401).json({ error: "User not found or unauthorized"});
  } else {
    req.user = user;
    next();
  };
}

//Routes
app.use('/author', authenticateUser, authorRoutes);
app.use('/admin', authenticateAdmin, adminRoutes);

// Example API endpoint
app.get('/', (req, res) => {
  res.send("woo front page of the api!");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
