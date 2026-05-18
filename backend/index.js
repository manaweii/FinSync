import dotenv from 'dotenv';
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { connectAuthDB } from './config/db.js';
import authRoutes from './routes/ValidateRoutes.js'; 
import subscriptionRoutes from './routes/SubscriptionRoutes.js';
import contactRoutes from './routes/ContactRoutes.js';

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

// Contact
app.use('/api', contactRoutes);

// Subscription
app.use('/api', subscriptionRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
