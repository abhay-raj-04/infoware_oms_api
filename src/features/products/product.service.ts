import prisma from '../../database/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductService {
  async list(params: { q?: string; supplierId?: string; skip?: number; take?: number }) {
    const { q, supplierId, skip = 0, take = 20 } = params;
    return prisma.product.findMany({
      where: {
        AND: [
          supplierId ? { supplierId } : {},
          q ? { name: { contains: q, mode: 'insensitive' } } : {},
        ],
      },
      include: { baseUom: true, inventory: true, supplier: { select: { id: true, username: true } } },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertProduct(data: {
    id?: string;
    supplierId: string;
    name: string;
    description?: string;
    pricePerUnit: number;
    baseUomId: string;
    initialStock?: number;
  }) {
    const { id, supplierId, name, description, pricePerUnit, baseUomId, initialStock } = data;

    const product = await prisma.product.upsert({
      where: { id: id ?? '' },
      update: { name, description: description ?? null, pricePerUnit: new Decimal(pricePerUnit), baseUomId },
      create: { name, description: description ?? null, pricePerUnit: new Decimal(pricePerUnit), baseUomId, supplierId },
    });

    if (typeof initialStock === 'number') {
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: { currentStockQuantity: new Decimal(initialStock) },
        create: { productId: product.id, currentStockQuantity: new Decimal(initialStock) },
      });
    }

    return product;
  }

  async updateStock(productId: string, delta: number, absolute?: boolean, uomId?: string) {
    const inv = await prisma.inventory.findUnique({ where: { productId } });
    let deltaDec = new Decimal(delta);
    
    if (uomId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { baseUomId: true } });
      if (!product) throw new Error('Product not found');
      if (uomId !== product.baseUomId) {
        const conv = await prisma.uomConversion.findUnique({ where: { fromUomId_toUomId: { fromUomId: uomId, toUomId: product.baseUomId } }, select: { conversionFactor: true } });
        if (!conv) throw new Error('No conversion available for selected UOM');
        deltaDec = deltaDec.mul(conv.conversionFactor as any);
      }
    }
    if (!inv) {
      if (absolute) {
        return prisma.inventory.create({ data: { productId, currentStockQuantity: deltaDec } });
      }
      throw new Error('No inventory found');
    }
  const newQty = absolute ? deltaDec : new Decimal(inv.currentStockQuantity as any).add(deltaDec);
    if (newQty.lt(0)) throw new Error('Stock cannot be negative');
    return prisma.inventory.update({ where: { productId }, data: { currentStockQuantity: newQty } });
  }
}
