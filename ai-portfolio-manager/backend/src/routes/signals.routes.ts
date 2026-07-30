import { Router } from 'express';
import * as SignalsController from '@/controllers/signals.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

router.use(verifyAccessTokenMiddleware);
router.get('/', asyncHandler(SignalsController.listSignals));
router.get('/:symbol', asyncHandler(SignalsController.getSignal));

export default router;
