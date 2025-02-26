import express from 'express';
// import redis from 'redis';
import cors from 'cors';
import session from 'express-session';
import userRoutes from './routes/userRoutes.js';
import { PrismaClient } from "@prisma/client";
import adminRoutes from "./routes/adminRoutes.js";
import authorRoutes from "./routes/authorRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";

const app = express();
export const prisma = new PrismaClient();
// export const redisClient = redis.createClient();
// redisClient.on("error", (err) => console.error("Redis Error:", err));
// redisClient.connect().then(() => console.log("Connected to Redis"));

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
    console.log("This is req.user:", req.user);
    const user_clean = {
      id: req.user.id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      country: req.user.country,
      referido: req.user.referido,
      email: req.user.email,
      categoryId: req.user.categoryId,
      role: req.user.role
    }
    res.json(user_clean)
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
  console.log(user);
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
  console.log(user);
  if (user === null || user.role !== "superadmin") {
    return res.status(401).json({ error: "User not found or unauthorized"});
  } else {
    req.user = user;
    next();
  };
}

//Routes
app.use('/author', authenticateUser, authorRoutes);
app.use('/admin', authenticateAdmin, adminRoutes);
app.use('/superadmin', authenticateSuperAdmin, superAdminRoutes);

// Example API endpoint
app.get('/', (req, res) => {
  res.send("woo front page of the api!");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
