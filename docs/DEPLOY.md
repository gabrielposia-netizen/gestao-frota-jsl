# Publicação em nuvem

**Status:** online

| Camada | Onde | URL |
|--------|------|-----|
| Frontend | **Vercel** | https://gestao-frota-jsl.vercel.app |
| API + Postgres | Railway | https://web-production-5d52d3.up.railway.app |

### Login admin
- Matrícula `ADMIN` / senha `102511`

O Vercel serve o frontend e encaminha `/api` e `/uploads` para a Railway (`frontend/vercel.json`).

## Redeploy frontend (Vercel)

```bash
cd frontend
npx vercel --prod --yes
```

## Redeploy API (Railway)

```bash
railway up --service web
railway domain --service web
```

Atualize o destino em `frontend/vercel.json` se o domínio da Railway mudar, e faça redeploy no Vercel.

## Observações de plano
- Vercel Hobby: frontend sempre online.  
- Railway: API/banco usam crédito do trial/plano — confira o painel. Para pausar: `railway down --service web` e `railway down --service Postgres`.
