import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { ProductService } from './product.service.js';
import { requireRoles } from '../auth/role.middleware.js';

const svc = new ProductService();

export class ProductController {
  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { q, supplierId, skip, take } = req.query as any;
      const data = await svc.list({
        q: q || undefined,
        supplierId: supplierId || undefined,
        skip: skip ? Number(skip) : 0,
        take: take ? Math.min(Number(take), 100) : 20,
      });
      res.json({ data });
    } catch (e) { next(e as any); }
  };

  upsert = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, name, description, pricePerUnit, baseUomId, initialStock } = req.body;
      const supplierId = req.user!.userId;
      const product = await svc.upsertProduct({ id, name, description, pricePerUnit, baseUomId, supplierId, initialStock });
      res.status(id ? 200 : 201).json({ product });
    } catch (e) { next(e as any); }
  };

  updateStock = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
  const { id } = req.params as any;
  const { quantity, absolute, uomId } = req.body;
  const inv = await svc.updateStock(id, Number(quantity), Boolean(absolute), uomId);
      res.json({ inventory: inv });
    } catch (e) { next(e as any); }
  };
}

export const onlySuppliers = requireRoles('SUPPLIER', 'ADMIN');
