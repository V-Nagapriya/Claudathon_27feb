import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { getDb } from './db/database';
import itemsRouter from './routes/items';
import authRouter from './routes/auth';
import csvRouter from './routes/csv';
import aiRouter from './routes/ai';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialise DB on startup
getDb();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'inventory-dashboard-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/csv', csvRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Inventory API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Default users: admin / admin123  |  viewer / viewer123\n`);
});

export default app;
