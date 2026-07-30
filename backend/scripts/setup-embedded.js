import dotenv from 'dotenv';
dotenv.config();

import startEmbeddedPostgres from '../src/db/embedded.js';
import { spawn } from 'child_process';

const port = Number(process.env.PG_EMBEDDED_PORT || 54329);
await startEmbeddedPostgres();
process.env.DATABASE_URL = `postgresql://frota:frota123@127.0.0.1:${port}/gestao_frota?schema=public`;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, env: process.env });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} => ${code}`))));
  });
}

await run('npx', ['prisma', 'db', 'push']);
await run('node', ['prisma/seed.js']);
console.log('PostgreSQL embutido ativo. Mantenha este terminal aberto.');
await new Promise(() => {});
