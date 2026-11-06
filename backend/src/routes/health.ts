import { Router } from 'express';
import { ok } from '../utils/respond';

interface HealthPayload {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

const router = Router();

router.get('/', (_req, res) => {
  const payload: HealthPayload = {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  ok(res, payload);
});

export default router;
