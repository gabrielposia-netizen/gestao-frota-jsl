# Acesso — Gestão de Frota JSL

## Online 24h (nuvem)

**Link único (PC e celular):**  
https://web-production-b3ca4.up.railway.app

- Página de acesso: https://web-production-b3ca4.up.railway.app/acesso.html  
- Login: https://web-production-b3ca4.up.railway.app/login  

Painel Railway: https://railway.com/project/67c44ff9-1be6-4dc9-af1b-5ec32937707c  

Guia de deploy: [`docs/DEPLOY.md`](DEPLOY.md)

### Login demo
- E-mail: `admin@frota.jsl`
- Senha: `admin123`

> O app roda na nuvem (Railway) e **não depende do seu PC**. No trial/plano gratuito da Railway, confira o uso no painel para não estourar o crédito.

## Túnel temporário (PC ligado)

Enquanto a nuvem não estiver publicada, dá para usar túnel Cloudflare (só funciona com o PC ligado):

```bash
# terminal 1 — frontend
cd frontend
npm run dev

# terminal 2 — túnel público
npx cloudflared tunnel --url http://127.0.0.1:5173
```

O Cloudflare gera um link `https://....trycloudflare.com` a cada execução.
