require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const preferenceRoutes = require('./routes/preferences')
const generateDrafts = require('./routes/generateDrafts');
const connectDB = require('./config/db')
const session = require('express-session');
const cron = require('node-cron');
const generateDraftsForAllUsers = require('./helpers/generateDraftsCron');

const app = express();
connectDB();
const PORT = process.env.PORT ||3001;

app.use(session({
  secret: 'your-secret-key',       // Choose a secure secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }        // Set to true in production with HTTPS
}));

app.use(express.json());

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true
}));

// Use routes
app.use('/', authRoutes);
app.use('/', emailRoutes);
app.use('/', preferenceRoutes);
app.use('/', generateDrafts);

cron.schedule('*/5 * * * *', () => {
  console.log('⏱️ Running draft generation job...');
  generateDraftsForAllUsers();
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
