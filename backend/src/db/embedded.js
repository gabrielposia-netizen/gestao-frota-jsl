import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EmbeddedPostgres from 'embedded-postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(__dirname, '../.pgdata');
const port = Number(process.env.PG_EMBEDDED_PORT || 54329);

async function startEmbeddedPostgres() {
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir,
    user: 'frota',
    password: 'frota123',
    port,
    persistent: true,
  });

  const initializedMarker = path.join(databaseDir, '.initialized');
  if (!fs.existsSync(initializedMarker)) {
    console.log('Inicializando PostgreSQL embutido...');
    await pg.initialise();
    fs.writeFileSync(initializedMarker, new Date().toISOString());
  }

  console.log(`Iniciando PostgreSQL embutido na porta ${port}...`);
  await pg.start();

  try {
    await pg.createDatabase('gestao_frota');
    console.log('Banco gestao_frota criado.');
  } catch {
    // já existe
  }

  process.env.DATABASE_URL = `postgresql://frota:frota123@127.0.0.1:${port}/gestao_frota?schema=public`;

  const shutdown = async () => {
    console.log('Encerrando PostgreSQL embutido...');
    try {
      await pg.stop();
    } catch (err) {
      console.error(err);
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return pg;
}

export default startEmbeddedPostgres;
