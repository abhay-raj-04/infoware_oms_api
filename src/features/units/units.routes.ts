import { Router } from 'express';
import prisma from '../../database/prisma.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const units = await prisma.unitOfMeasure.findMany({ include: { uomConversionsFrom: true, uomConversionsTo: true } });
    res.json({ data: units });
  } catch (e) { next(e as any); }
});

export default router;
