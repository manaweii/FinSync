import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectAuthDB } from './config/db.js';
import authRoutes from './routes/ValidateRoutes.js';
// import ImportModel from "./models/Import.js";


// Load env
dotenv.config();

// Create app
const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());

// Connect to DB
connectAuthDB();

// Routes
app.use('/api', authRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
