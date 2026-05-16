import { checkDataReadiness } from '../lib/dataReadiness';
import { PnlUpdateService } from '../services/pnlUpdateService';
import { readState } from '../lib/runStateStore';
import { logger } from '../utils/logger';

export async function runDailyPnlJob(date?: string) {
  const targetDateStr = date || new Date().toISOString().split('T')[0];
  const targetDate = new Date(targetDateStr);

  logger.info(`DailyPnlJob: Starting for ${targetDateStr}`);

  // 1. Check Readiness
  const readiness = checkDataReadiness(targetDateStr);
  if (!readiness.canProceed) {
    logger.warn(`DailyPnlJob: Aborting. ${readiness.message}`);
    return { status: readiness.status, message: readiness.message, usersUpdated: 0, skipCount: 0 };
  }

  // 2. Get Available Symbols from state
  const state = readState();
  const availableSymbols = new Set(
    (state?.agentResults?.marketData?.symbols || [])
      .filter((s: any) => s.status === 'OK')
      .map((s: any) => s.symbol)
  );

  // 3. Run Update
  try {
    const service = new PnlUpdateService();
    const result = await service.updateAllUsers(targetDate, availableSymbols);
    
    logger.info('DailyPnlJob: Completed successfully', result);
    return { status: 'SUCCESS', usersUpdated: result.successCount, skipCount: result.skipCount };
  } catch (error: any) {
    logger.error('DailyPnlJob: Failed unexpectedly', { error });
    return { status: 'FAILED', message: error.message, usersUpdated: 0, skipCount: 0 };
  }
}
