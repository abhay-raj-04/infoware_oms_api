import prisma from '../../database/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

export type Decimalish = number | string | Decimal;

export async function convertQuantity(
  productId: string,
  fromUomId: string,
  qty: Decimalish,
): Promise<Decimal> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { baseUomId: true },
  });
  if (!product) throw new Error('Product not found');

  const asDec = new Decimal(qty as any);

  if (fromUomId === product.baseUomId) return asDec;

  const direct = await prisma.uomConversion.findUnique({
    where: {
      fromUomId_toUomId: { fromUomId, toUomId: product.baseUomId },
    },
    select: { conversionFactor: true },
  });
  if (!direct) throw new Error('No conversion available for selected UOM');
  return asDec.mul(direct.conversionFactor as any);
}
