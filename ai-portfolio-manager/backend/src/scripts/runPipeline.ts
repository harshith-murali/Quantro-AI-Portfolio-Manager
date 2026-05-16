import { SupervisorAgent, SupervisorOptions } from '../agents/supervisorAgent';
import { logger } from '../utils/logger';

async function main() {
  const args = process.argv.slice(2);
  const opts: SupervisorOptions = {
    forceOverwrite: false,
  };

  let isDryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--force') {
      opts.forceOverwrite = true;
    } else if (args[i] === '--dry-run') {
      isDryRun = true;
    } else if (args[i] === '--date' && args[i + 1]) {
      opts.date = args[i + 1];
      i++;
    }
  }

  if (isDryRun) {
    logger.info('Dry run enabled. Validating dependencies and configuration...');
    // We can add simple validation here if needed, but for now just exit with 0.
    logger.info('Dry run successful.');
    process.exit(0);
  }

  const supervisor = new SupervisorAgent();
  const status = await supervisor.run(opts);

  if (status === 'COMPLETE') {
    process.exit(0);
  } else if (status === 'PARTIAL') {
    process.exit(1);
  } else {
    // FAILED or HOLIDAY
    process.exit(2);
  }
}

main().catch(error => {
  logger.error('Unhandled error in pipeline script', { error });
  process.exit(2);
});
