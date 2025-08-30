import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware.js';
import { OrderController, onlyBuyers, onlyAdmins } from './order.controller.js';

const router = Router();
const ctrl = new OrderController();

// Place order (buyer)
router.post('/', authenticateToken, onlyBuyers, (req, res, next) => ctrl.place(req as any, res, next));

// Role-aware list
router.get('/', authenticateToken, (req, res, next) => ctrl.list(req as any, res, next));

// Admin
router.patch('/:id/status', authenticateToken, onlyAdmins, (req, res, next) => ctrl.changeStatus(req as any, res, next));
router.get('/admin/analytics', authenticateToken, onlyAdmins, (req, res, next) => ctrl.analytics(req as any, res, next));

export default router;
