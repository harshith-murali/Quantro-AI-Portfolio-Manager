import { Router } from 'express';
import * as WatchlistController from '@/controllers/watchlist.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

router.use(verifyAccessTokenMiddleware);
router.get('/', asyncHandler(WatchlistController.list));
router.post('/', asyncHandler(WatchlistController.add));
router.delete('/:symbol', asyncHandler(WatchlistController.remove));

export default router;
