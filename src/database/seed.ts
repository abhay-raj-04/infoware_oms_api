import 'dotenv/config';
import prisma from './prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

async function main() {
  const kg = await prisma.unitOfMeasure.upsert({ where: { symbol: 'KG' }, update: {}, create: { name: 'Kilogram', symbol: 'KG', isBase: true } });
  const gm = await prisma.unitOfMeasure.upsert({ where: { symbol: 'GM' }, update: {}, create: { name: 'Gram', symbol: 'GM', isBase: false } });
  const lt = await prisma.unitOfMeasure.upsert({ where: { symbol: 'LT' }, update: {}, create: { name: 'Litre', symbol: 'LT', isBase: true } });
  const ml = await prisma.unitOfMeasure.upsert({ where: { symbol: 'ML' }, update: {}, create: { name: 'Millilitre', symbol: 'ML', isBase: false } });

  await prisma.uomConversion.upsert({
    where: { fromUomId_toUomId: { fromUomId: gm.id, toUomId: kg.id } },
    update: { conversionFactor: new Decimal('0.001') },
    create: { fromUomId: gm.id, toUomId: kg.id, conversionFactor: new Decimal('0.001') },
  });
  await prisma.uomConversion.upsert({
    where: { fromUomId_toUomId: { fromUomId: ml.id, toUomId: lt.id } },
    update: { conversionFactor: new Decimal('0.001') },
    create: { fromUomId: ml.id, toUomId: lt.id, conversionFactor: new Decimal('0.001') },
  });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
