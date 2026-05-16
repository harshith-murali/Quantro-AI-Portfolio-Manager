import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export type PipelineStatus = 'RUNNING' | 'COMPLETE' | 'PARTIAL' | 'DELAYED' | 'HOLIDAY' | 'FAILED';

export interface SymbolResult {
  symbol: string;
  status: 'OK' | 'STALE' | 'EMPTY' | 'ERROR';
  rowsSaved: number;
  maxDate?: string;
  message?: string;
}

export interface PipelineState {
  date: string;
  status: PipelineStatus;
  startedAt: string;
  completedAt?: string;
  agentResults?: {
    marketData?: {
      total: number;
      successCount: number;
      symbols: SymbolResult[];
    };
    portfolioIntelligence?: {
      status: string;
      usersUpdated: number;
      skipCount: number;
      message?: string;
    };
  };
  error?: string;
}

const STATE_FILE_PATH = path.resolve(process.cwd(), '.pipeline-state.json');

export function readState(): PipelineState | null {
  try {
    if (!fs.existsSync(STATE_FILE_PATH)) return null;
    const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(data) as PipelineState;
  } catch (error) {
    logger.error('Failed to read pipeline state', { error });
    return null;
  }
}

export function writeState(state: PipelineState): void {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Failed to write pipeline state', { error });
  }
}
