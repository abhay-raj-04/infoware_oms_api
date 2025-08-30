import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { OrderService } from './order.service.js';
import { requireRoles } from '../auth/role.middleware.js';

const svc = new OrderService();

export class OrderController {
  place = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const buyerId = req.user!.userId;
      const { items } = req.body as any;
      const order = await svc.placeOrder(buyerId, items);
      res.status(201).json({ order });
    } catch (e) { next(e as any); }
  };

  myOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orders = await svc.listBuyerOrders(req.user!.userId);
      res.json({ data: orders });
    } catch (e) { next(e as any); }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user!.role === 'BUYER') {
        const orders = await svc.listBuyerOrders(req.user!.userId);
        return res.json({ data: orders });
      }
      if (req.user!.role === 'SUPPLIER') {
        const data = await svc.listSupplierOrders(req.user!.userId);
        return res.json({ data });
      }
      if (req.user!.role === 'ADMIN') {
        const supplierId = req.query.supplier_id as string | undefined;
        if (!supplierId) return res.status(400).json({ message: 'supplier_id is required for admin' });
        const data = await svc.listSupplierOrders(supplierId);
        return res.json({ data });
      }
      return res.status(403).json({ message: 'Forbidden' });
    } catch (e) { next(e as any); }
  };

  changeStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as any;
      const { status } = req.body as { status: 'APPROVED'|'SHIPPED'|'DELIVERED'|'CANCELLED' };
      const updated = await svc.changeStatus(id, status, req.user!.userId);
      res.json({ order: updated });
    } catch (e) { next(e as any); }
  };

  analytics = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await svc.analytics();
      res.json({ data });
    } catch (e) { next(e as any); }
  };
}

export const onlyBuyers = requireRoles('BUYER');
export const onlySuppliers = requireRoles('SUPPLIER', 'ADMIN');
export const onlyAdmins = requireRoles('ADMIN');
