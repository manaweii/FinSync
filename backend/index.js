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
    origin: (origin, callback) => {
      const envOrigins = (process.env.CORS_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const defaultOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
      ];

      const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

      // Allow same-machine tools, Postman/curl, and file:// contexts (no origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
