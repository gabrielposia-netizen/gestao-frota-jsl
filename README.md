# Gestão de Frota JSL

Sistema interno de gestão de frota para operação logística — controle de veículos, motoristas, manutenção, combustível, documentos e indicadores em tempo real.

## Links de acesso

| Canal | URL |
|-------|-----|
| **Online 24h (PC e celular)** | https://web-production-b3ca4.up.railway.app |
| Página de acesso | https://web-production-b3ca4.up.railway.app/acesso.html |
| Login | https://web-production-b3ca4.up.railway.app/login |

Detalhes em [`docs/ACESSOS.md`](docs/ACESSOS.md). Deploy: [`docs/DEPLOY.md`](docs/DEPLOY.md).
## Materiais para gerência

- [`docs/apresentacao-gerencia.html`](docs/apresentacao-gerencia.html) — apresentação executiva (setas do teclado)
- [`docs/tutorial-app.html`](docs/tutorial-app.html) — tutorial interativo
- [`docs/video/tutorial-gestao-frota.mp4`](docs/video/tutorial-gestao-frota.mp4) — vídeo tutorial

## Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express (API REST)
- **Banco:** PostgreSQL + Prisma ORM
- **Auth:** JWT (Administrador / Supervisor / Operador)

## Como executar (desenvolvimento local)

### 1) Banco + seed (deixe este terminal aberto)

```bash
cd backend
npm install
npm approve-scripts --all
node scripts/setup-embedded.js
```

### 2) API

```bash
cd backend
npm run dev
```

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usuários de demonstração

| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@frota.jsl | admin123 | Administrador |
| supervisor@frota.jsl | super123 | Supervisor |
| operador@frota.jsl | oper123 | Operador |

## Módulos

Dashboard com KPIs clicáveis, veículos (incluindo empilhadeiras/rebocadores), motoristas, entrada/saída, checklists, abastecimento com comprovante/cartão, manutenção com NF e aprovação, pneus, avarias com fotos, mapa, QR Code, relatórios PDF/Excel, painel TV, notificações, modo escuro e controle de acessos.
