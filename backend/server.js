import express from 'express';
import cors from 'cors';
import session from 'express-session';
// import userRoutes from './routes/userRoutes.js';
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import adminRoutes from "./routes/adminRoutes.js";
import authorRoutes from "./routes/authorRoutes.js"
import { sendResetPasswordMail } from './mailer.js';
import { matchConfirmationCode } from './utils.js';

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

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({where: {email: email}});
    if (user === null) {
      return res.status(401).send("No tenemos una cuenta registrada con este correo.");
    }

    if (user.email === email && (await bcrypt.compare(password, user.password))) {
      req.session.user_id =  user.id ;
      console.log("created session id with:", req.session.user_id);
      res.status(200).send(user);
    } else {
      res.status(401).json({error: "Wrong password or email address"});
    }
  } catch(error) {
    console.error(error);
  }
})

app.get('/api/user', async (req, res) => {
  try {
    const email = req.query.email;
    const user = await prisma.user.findUnique({where: {email: email}});

    if (user === null) {
      res.status(204).json("No user with this email were found");
    } else {
      sendResetPasswordMail(email, user.first_name)
      res.status(200).json(user);
    }
  } catch (error) {
    console.error("Error retrieving the user:", error)
  }
})

app.post('/api/confirmation_code', async (req, res) => {
  try {
    const { confirmation_code, user_id } = req.body;
    const matched = await matchConfirmationCode(confirmation_code, user_id);

    if (matched === true) {
      const user = await prisma.user.findUnique({where: {id: user_id}});
      req.session.user_id = user.id;
      console.log("added session user id:", req.session.user_id);
      res.status(200).json({message: "All good"});
    } else {
      res.status(401).json({error: "Unauthorized"});
    }
  } catch(error) {
    console.error("Error confirming code:", error);
    res.status(500).json({error: 'A server error ocurred while confirming the code'});
  }
})

app.post('/api/logout', async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error when destroying session in logout route -server.js', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
    });
    res.clearCookie('connect.sid');
    res.json({message: 'Logged out'});
  } catch(error) {
    console.error("Error in logout route from server js:", error);
  }
})

app.get('/api/checkPermissions', authenticateUser, async (req, res) => {
  try {
    // const response = await authenticateUser(req, res);
    // const data = await response.json();
    console.log('data from checkPermissions: ', req.user);
    res.json({user: req.user})
    // return data;
  } catch(error) {
    console.log("Error running checkPermissions in userRoutes:", error);
    res.status(500).json({error: "Error in checkPermissions"});
  }
})

// app.use("/api", userRoutes);

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
    console.log("all good");
    req.user = user;
    next();
  };
}

//Routes
// app.use('/api', authenticateUser, userRoutes);
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
