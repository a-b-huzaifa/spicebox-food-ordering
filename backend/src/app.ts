import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurants';
import menuItemRoutes from './routes/menuItems';
import userRoutes from './routes/users';
import orderRoutes from './routes/orders';
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
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Later stages mount: /api/payments, /api/reviews, /api/admin ...

app.use(notFound);
app.use(errorHandler);

export default app;
