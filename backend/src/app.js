import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';

import authRoutes from './routes/authRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import topicRoutes from './routes/topicRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import mockRoutes from './routes/mockRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import timingRoutes from './routes/timingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Simple, dependency-free smoke-test endpoint — deliberately does not touch
// the database, so it reports "the HTTP layer is up" independent of Mongo.
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mocks', mockRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/interview-timing', timingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notes', noteRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
