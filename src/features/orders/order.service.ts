import prisma from '../../database/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import { convertQuantity } from '../units/conversion.js';
import { getIO } from '../../utils/socket.js';

type PlaceOrderItem = { productId: string; supplierId: string; quantity: number; uomId: string };

export class OrderService {
  async placeOrder(buyerId: string, items: PlaceOrderItem[]) {
    if (!items?.length) throw new Error('No items provided');

    return prisma.$transaction(async (tx) => {
      // Preload products and prices
      const productIds = [...new Set(items.map(i => i.productId))];
      const products = await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true, pricePerUnit: true, baseUomId: true, supplierId: true } });
      const prodMap = new Map(products.map(p => [p.id, p]));

      // Convert to base uom and compute totals
      const lineCalculations = await Promise.all(items.map(async (it) => {
        const prod = prodMap.get(it.productId);
        if (!prod) throw new Error('Product not found');
        if (prod.supplierId !== it.supplierId) throw new Error('Supplier mismatch');
        const baseQty = await convertQuantity(it.productId, it.uomId, it.quantity);
        const lineTotal = new Decimal(prod.pricePerUnit as any).mul(baseQty as any);
        return { ...it, baseQty, priceAtOrder: new Decimal(prod.pricePerUnit as any), lineItemTotal: lineTotal };
      }));

      // Check stock for each product
      const invs = await tx.inventory.findMany({ where: { productId: { in: productIds } } });
      const invMap = new Map(invs.map(i => [i.productId, i]));
      for (const calc of lineCalculations) {
        const inv = invMap.get(calc.productId);
        const available = new Decimal(inv?.currentStockQuantity as any || 0);
        if (available.lt(calc.baseQty)) {
          throw new Error('Insufficient stock for product: ' + calc.productId);
        }
      }

      // Create order + items, initial status
      const totalAmount = lineCalculations.reduce((acc, c) => acc.add(c.lineItemTotal), new Decimal(0));
      const order = await tx.order.create({
        data: {
          buyerId,
          totalAmount,
          currentStatus: 'PENDING',
          items: {
            create: lineCalculations.map(c => ({
              productId: c.productId,
              supplierId: c.supplierId,
              quantity: c.baseQty, // persisted in base UOM
              uomId: (prodMap.get(c.productId)!.baseUomId),
              priceAtOrder: c.priceAtOrder,
              lineItemTotal: c.lineItemTotal,
            })),
          },
          statusHistory: { create: { newStatus: 'PENDING', changedByUserId: buyerId } },
        },
        include: { items: true, statusHistory: true },
      });

      return order;
    });
  }

  async listBuyerOrders(buyerId: string) {
    return prisma.order.findMany({
      where: { buyerId },
      include: { items: { include: { product: true } }, statusHistory: { orderBy: { changeTimestamp: 'asc' } } },
      orderBy: { orderDate: 'desc' },
    });
  }

  async listSupplierOrders(supplierId: string) {
    // orders containing items for this supplier
    return prisma.order.findMany({
      where: { items: { some: { supplierId } } },
      include: { items: { where: { supplierId }, include: { product: true } }, statusHistory: { orderBy: { changeTimestamp: 'asc' } } },
      orderBy: { orderDate: 'desc' },
    });
  }

  async changeStatus(orderId: string, newStatus: 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED', changedByUserId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!existing) throw new Error('Order not found');
      const oldStatus = existing.currentStatus as any;

      // Stock deduction on APPROVED only (idempotent-ish):
      if (oldStatus === 'PENDING' && newStatus === 'APPROVED') {
        for (const item of existing.items) {
          const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
          const current = new Decimal(inv?.currentStockQuantity as any || 0);
          const next = current.sub(new Decimal(item.quantity as any));
          if (next.lt(0)) throw new Error('Insufficient stock during approval');
          await tx.inventory.upsert({
            where: { productId: item.productId },
            update: { currentStockQuantity: next },
            create: { productId: item.productId, currentStockQuantity: next },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          currentStatus: newStatus,
          statusHistory: { create: { oldStatus, newStatus, changedByUserId } },
        },
        include: { statusHistory: true },
      });

      const io = getIO();
      if (io) io.emit('order-status-updated', { orderId, oldStatus, newStatus });

      return updated;
    });
  }

  async analytics() {
    const counts = await prisma.order.groupBy({ by: ['currentStatus'], _count: { _all: true } });
    const revenueBySupplier = await prisma.orderItem.groupBy({ by: ['supplierId'], _sum: { lineItemTotal: true } });
    return { counts, revenueBySupplier };
  }
}
