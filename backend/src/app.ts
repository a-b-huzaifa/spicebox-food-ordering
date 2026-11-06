import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import { ok } from './utils/respond';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  ok(res, { name: 'Spicebox API', docs: '/api/health' });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Later stages mount: /api/restaurants, /api/menu-items,
// /api/orders, /api/payments, /api/reviews, /api/admin ...

app.use(notFound);
app.use(errorHandler);

export default app;
