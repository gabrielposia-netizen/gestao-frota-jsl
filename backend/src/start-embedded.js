import dotenv from 'dotenv';
dotenv.config();

import { spawn } from 'child_process';
import startEmbeddedPostgres from './db/embedded.js';

const pg = await startEmbeddedPostgres();

process.env.DATABASE_URL = `postgresql://frota:frota123@127.0.0.1:${process.env.PG_EMBEDDED_PORT || 54329}/gestao_frota?schema=public`;

async function run(cmd, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

try {
  await run('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
  await run('node', ['prisma/seed.js']);
  await run('node', ['--watch', 'src/index.js']);
} catch (err) {
  console.error(err);
  try {
    await pg.stop();
  } catch {}
  process.exit(1);
}
