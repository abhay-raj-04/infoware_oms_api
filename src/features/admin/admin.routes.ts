import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware.js';
import { requireRoles } from '../auth/role.middleware.js';
import { OrderService } from '../orders/order.service.js';

const router = Router();
const svc = new OrderService();

router.get('/analytics', authenticateToken, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const data = await svc.analytics();
    res.json({ data });
  } catch (e) { next(e as any); }
});

export default router;
