import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import vehiclesRoutes from './routes/vehicles.js';
import driversRoutes from './routes/drivers.js';
import movementsRoutes from './routes/movements.js';
import checklistsRoutes from './routes/checklists.js';
import fuelingsRoutes from './routes/fuelings.js';
import maintenancesRoutes from './routes/maintenances.js';
import tiresRoutes from './routes/tires.js';
import damagesRoutes from './routes/damages.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationsRoutes from './routes/notifications.js';
import reportsRoutes from './routes/reports.js';
import searchRoutes from './routes/search.js';
import shiftsRoutes from './routes/shifts.js';
import { uploadDir } from './middleware/upload.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const rawCors = process.env.CORS_ORIGIN;
const corsOrigin =
  !rawCors || rawCors === '*'
    ? true
    : rawCors.split(',').map((s) => s.trim());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(uploadDir)));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'gestao-frota-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/checklists', checklistsRoutes);
app.use('/api/fuelings', fuelingsRoutes);
app.use('/api/maintenances', maintenancesRoutes);
app.use('/api/tires', tiresRoutes);
app.use('/api/damages', damagesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/shifts', shiftsRoutes);

// Produção: serve o frontend buildado no mesmo serviço
const frontendDist = process.env.FRONTEND_DIST || path.resolve(__dirname, '../../frontend/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

export default app;
