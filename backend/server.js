import express from 'express';
import cors from 'cors';
import session from 'express-session';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Middleware
app.use(cors());
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
app.use('/api', userRoutes);

// Example API endpoint
app.get('/', (req, res) => {
  res.send("woo front page of the api!");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
