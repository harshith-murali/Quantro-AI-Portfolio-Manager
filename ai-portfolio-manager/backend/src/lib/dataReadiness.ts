import { readState, PipelineStatus } from './runStateStore';
import { logger } from '../utils/logger';

export interface ReadinessResult {
  canProceed: boolean;
  status: PipelineStatus;
  message: string;
}

/**
 * Inspects the current pipeline state to determine if PnL updates should proceed.
 */
export function checkDataReadiness(dateStr: string): ReadinessResult {
  const state = readState();

  if (!state) {
    return {
      canProceed: false,
      status: 'FAILED',
      message: `No pipeline state found for date ${dateStr}. Run the Market Data Agent first.`
    };
  }

  switch (state.status) {
    case 'HOLIDAY':
      return {
        canProceed: false,
        status: 'HOLIDAY',
        message: 'Today is a market holiday. Skipping PnL updates.'
      };
    case 'FAILED':
      return {
        canProceed: false,
        status: 'FAILED',
        message: 'Market Data Agent failed completely. Skipping updates to protect production analytics.'
      };
    case 'DELAYED':
      return {
        canProceed: false,
        status: 'DELAYED',
        message: 'Market Data is delayed. Waiting for retry.'
      };
    case 'COMPLETE':
      return {
        canProceed: true,
        status: 'COMPLETE',
        message: 'Market data is fully available.'
      };
    case 'PARTIAL':
      return {
        canProceed: true,
        status: 'PARTIAL',
        message: 'Market data is partially available. Proceeding with coverage guards.'
      };
    default:
      return {
        canProceed: false,
        status: 'FAILED',
        message: `Unknown pipeline status: ${state.status}`
      };
  }
}
