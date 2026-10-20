# Yahoo Finance historical data in S3

Bucket: `amzn-test-1103`, region `ap-southeast-2`.

Snapshot manifest: `market-data/yahoo/2026-10-20T01-58-47-299Z/manifest.json`.

This snapshot contains **61 CSV files and 74,872 observed daily rows**, fetched only from Yahoo Finance. The requested window starts 20 October 2021 and ends before 20 October 2026. Actual coverage is recorded per symbol, including shorter histories for newer listings. Objects are private and use S3 AES256 server-side encryption. Each CSV has source metadata and a SHA-256 recorded in the manifest.

Three requested symbols were excluded: Yahoo returned no history for `LTIM` and `TATAMOTORS`; `CONSUMBEES` exceeded the ingestion limit for invalid OHLC rows. No data was fabricated or substituted from another provider. HDFC was removed from the backtest dropdown because it is not an available supported symbol; other available dropdown symbols are included.

## Backend configuration

```
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=amzn-test-1103
BACKTEST_DATA_PROVIDER=s3
BACKTEST_S3_MANIFEST_KEY=market-data/yahoo/2026-10-20T01-58-47-299Z/manifest.json
MARKET_PRICE_PROVIDER=yahoo
```

The backtest provider is independent of the quote provider. S3 backtests read this fixed snapshot and do not silently download Yahoo data on a read failure. Paper trading, live valuation and technical signals keep their existing quote/history configuration.

The backend's EC2 instance needs an instance role with the policy in `scripts/aws/quantro-backtest-s3-read.json`. No permanent AWS keys are needed. Console-created EC2 roles automatically get an instance profile. The Docker network may require the instance metadata response hop limit to be 2 for temporary credentials.

## Validation and reproducibility

The backend validates source, bucket, object paths, CSV checksums, row counts, date coverage, symbols and valid OHLCV values before simulation. Completed bars are sorted and unique. The report records the exact S3 key, Yahoo origin, snapshot timestamp and dataset hash. Saved backtest runs retain the existing strategy version and simulation input hash.

All 61 uploaded CSVs were read back and passed checksum/coverage validation. TCS, INFY, RELIANCE and NIFTYBEES simulations completed with direct Yahoo network calls disabled. The regression suite has 20 passing tests, including tampered data, invalid OHLC, missing fields, duplicate dates and wrong bucket/key rejection.

## Refresh manually

Run from the backend folder using an AWS profile with permission to write this prefix:

```
npm run build
AWS_REGION=ap-southeast-2 AWS_S3_BUCKET=amzn-test-1103 node scripts/seedYahooS3.cjs
```

The command writes a new timestamped snapshot and prints its manifest key. Inspect failures and run `scripts/verifyYahooSnapshot.cjs` with the new manifest key, then explicitly update the backend configuration. It does not overwrite an active snapshot or automatically switch production. No refresh schedule has been configured.

## Rollout state

The S3-enabled backend image is `quantro-s3-backtest:20261020` (SHA `30ed559f0e2dfce077e9ce7e1c827ddf9cf29bb10c6fdd6babce43446c0f8b2a`). All 20 tests passed inside that Node 22 image. The prior production image is retained as `quantro-before-s3-backtest:20261020`; its environment backup is `/home/ec2-user/quantro-s3-backup-20261020/env.production`.

**Production has not been switched to S3 yet.** The EC2 instance has no instance profile and the current CLI user was denied `iam:CreateRole`. The existing production backend remains on its working Yahoo path. After attaching the read-only EC2 role, verify S3 access from `quantro-s3-preview`, run the API/backtest checks, set the two BACKTEST variables in production, then promote the tested image. Instance metadata already requires IMDSv2 and has hop limit 2, suitable for the Docker SDK credential chain.
