import { logger } from '../utils/logger';
import { MarketDataAgent } from './marketDataAgent';
import { runDailyPnlJob } from '../jobs/dailyPnlJob';
import { writeState, PipelineState, PipelineStatus } from '../lib/runStateStore';
import fs from 'fs';
import path from 'path';

// Hardcoded NSE holidays 2025-2026 (simplified for example)
const NSE_HOLIDAYS = [
  '2025-01-26', '2025-02-26', '2025-03-14', '2025-03-31', '2025-04-10', '2025-04-14', '2025-04-18', '2025-05-01',
  '2025-08-15', '2025-08-27', '2025-10-02', '2025-10-21', '2025-11-05', '2025-12-25',
  '2026-01-26', '2026-03-03', '2026-03-20', '2026-04-03', '2026-04-14', '2026-05-01',
  '2026-08-15', '2026-09-07', '2026-10-02', '2026-10-20', '2026-11-08', '2026-12-25'
];

function isNSEHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  const day = date.getDay();
  // 0 is Sunday, 6 is Saturday
  if (day === 0 || day === 6) return true;
  return NSE_HOLIDAYS.includes(dateStr);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SupervisorOptions {
  forceOverwrite?: boolean;
  date?: string; // YYYY-MM-DD
}

export class SupervisorAgent {
  async run(opts: SupervisorOptions = {}) {
    const targetDate = opts.date ? new Date(opts.date) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];
    const startTime = new Date().toISOString();

    logger.info('SupervisorAgent: Starting daily pipeline', { dateStr, opts });

    let state: PipelineState = {
      date: dateStr,
      status: 'RUNNING',
      startedAt: startTime,
    };
    writeState(state);

    if (isNSEHoliday(targetDate) && !opts.forceOverwrite) {
      logger.info('SupervisorAgent: Today is an NSE holiday or weekend. Stopping.');
      state.status = 'HOLIDAY';
      state.completedAt = new Date().toISOString();
      writeState(state);
      this.writeFinalArtifact(state);
      return state.status;
    }

    let mdaResult = await new MarketDataAgent(opts.forceOverwrite, targetDate).run();
    let status = this.classifyMarketData(mdaResult);

    if (status === 'DELAYED') {
      logger.warn('SupervisorAgent: Market Data returned DELAYED. Sleeping for 10 minutes before retry...');
      await sleep(10 * 60 * 1000);
      logger.info('SupervisorAgent: Retrying MarketDataAgent...');
      mdaResult = await new MarketDataAgent(opts.forceOverwrite, targetDate).run();
      status = this.classifyMarketData(mdaResult);
    }

    state.agentResults = {
      marketData: mdaResult
    };

    if (status === 'FAILED' || status === 'HOLIDAY') {
      logger.error('SupervisorAgent: Market Data failed or was empty (holiday?). Stopping pipeline.', { status });
      state.status = status;
      state.completedAt = new Date().toISOString();
      writeState(state);
      this.writeFinalArtifact(state);
      return status;
    }

    // Prepare valid symbols for Portfolio Intelligence
    const mode = status === 'COMPLETE' ? 'COMPLETE' : 'PARTIAL';
    state.status = status;
    writeState(state);

    const piaResult = await runDailyPnlJob(dateStr);
    
    state.agentResults.portfolioIntelligence = piaResult;
    state.status = status;
    state.completedAt = new Date().toISOString();
    writeState(state);
    this.writeFinalArtifact(state);

    logger.info(`SupervisorAgent: Pipeline finished with status ${status}`);
    return status;
  }

  private classifyMarketData(result: any): PipelineStatus {
    if (result.symbols.every((s: any) => s.status === 'EMPTY')) return 'HOLIDAY';
    
    const ratio = result.successCount / result.total;
    if (ratio >= 0.95) return 'COMPLETE';
    if (ratio >= 0.5) return 'PARTIAL';
    
    // If it's terrible, maybe it's just delayed publishing by Yahoo
    // Could refine this to check if errors are timeouts vs auth issues
    if (ratio < 0.5 && result.successCount > 0) return 'DELAYED';
    
    return 'FAILED';
  }

  private writeFinalArtifact(state: PipelineState) {
    const artifactPath = path.resolve(process.cwd(), 'pipeline-artifact.md');
    let content = `# Pipeline Run Artifact - ${state.date}\n\n`;
    content += `- **Status**: ${state.status}\n`;
    content += `- **Started**: ${state.startedAt}\n`;
    content += `- **Completed**: ${state.completedAt || 'N/A'}\n\n`;

    if (state.agentResults?.marketData) {
      content += `## Market Data Agent\n`;
      content += `- Total requested: ${state.agentResults.marketData.total}\n`;
      content += `- Success count: ${state.agentResults.marketData.successCount}\n`;
    }

    if (state.agentResults?.portfolioIntelligence) {
      content += `## Portfolio Intelligence Agent\n`;
      content += `- Status: ${state.agentResults.portfolioIntelligence.status}\n`;
      content += `- Users updated: ${state.agentResults.portfolioIntelligence.usersUpdated}\n`;
      content += `- Users skipped: ${state.agentResults.portfolioIntelligence.skipCount}\n`;
    }

    fs.writeFileSync(artifactPath, content, 'utf-8');
  }
}
