// The deployed database predates Prisma migration tracking. Apply only this
// additive release DDL, atomically, without baselining or resetting existing tables.
const fs=require('node:fs');
const db=require('../dist/config/db').default;
(async()=>{const sql=fs.readFileSync(__dirname+'/../prisma/migrations/20261020000000_audit_artifacts/migration.sql','utf8');await db.$transaction(async tx=>{for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean))await tx.$executeRawUnsafe(statement);});console.log('Additive artifact tables verified. Existing tables and records were not reset.');})().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>db.$disconnect());
