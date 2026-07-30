# Acesso — Gestão de Frota JSL

## Online 24h (nuvem) — recomendado

Para o sistema **não depender do seu PC**, publique no Render:

1. Abra: https://dashboard.render.com/select-repo?type=blueprint  
2. Conecte o GitHub e escolha o repositório **gestao-frota-jsl**  
3. Confirme o Blueprint e clique em **Apply**  
4. Ao terminar o deploy, a URL permanente aparece no painel (ex.: `https://gestao-frota-jsl.onrender.com`)

Guia completo: [`docs/DEPLOY.md`](DEPLOY.md)

### Login demo
- E-mail: `admin@frota.jsl`
- Senha: `admin123`

> No plano Free do Render o app pode “dormir” após ~15 min sem uso. Para ficar acordado o tempo todo, use o plano **Starter**.

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
