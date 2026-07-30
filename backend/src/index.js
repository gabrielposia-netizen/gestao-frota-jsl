import app from './app.js';
import { checkExpiringDocuments } from './services/notifications.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API Gestão de Frota rodando em http://localhost:${PORT}`);
  // Scan expirations on boot and every 6h
  checkExpiringDocuments().catch(console.error);
  setInterval(() => checkExpiringDocuments().catch(console.error), 6 * 60 * 60 * 1000);
});
