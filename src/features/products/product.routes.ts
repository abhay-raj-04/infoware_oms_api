import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware.js';
import { ProductController, onlySuppliers } from './product.controller.js';

const router = Router();
const ctrl = new ProductController();

// public list for buyers
router.get('/', (req, res, next) => ctrl.list(req as any, res, next));

// suppliers can create/update products
router.post('/', authenticateToken, onlySuppliers, (req, res, next) => ctrl.upsert(req as any, res, next));

// update stock
router.patch('/:id/stock', authenticateToken, onlySuppliers, (req, res, next) => ctrl.updateStock(req as any, res, next));

export default router;
