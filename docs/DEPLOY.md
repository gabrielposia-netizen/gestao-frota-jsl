# Publicação em nuvem (24h online)

**Status:** publicado na Railway.

**URL permanente:** https://web-production-b3ca4.up.railway.app  

Painel: https://railway.com/project/67c44ff9-1be6-4dc9-af1b-5ec32937707c

### Login demo
- admin@frota.jsl / admin123  

## Redeploy (quando alterar o código)

```bash
railway up --service web
```

Ou conecte o repositório GitHub no serviço `web` para deploy automático a cada push.

## Opção alternativa: Render

1. Acesse: https://dashboard.render.com/select-repo?type=blueprint  
2. Selecione o repositório **gestao-frota-jsl**  
3. Confirme o Blueprint (`render.yaml`) → **Apply**

### Observações de plano
- Railway: confira créditos/trial no painel (`sleepApplication` está desligado neste deploy).  
- Render Free: o Web Service pode dormir após ~15 min; Postgres Free expira em 30 dias.

## O que muda na arquitetura

| Item | Antes (seu PC) | Agora (nuvem) |
|------|----------------|---------------|
| Banco | Pasta local `.pgdata` | PostgreSQL gerenciado |
| App | Precisa PC ligado | Roda 24h no servidor |
| Link | Túnel temporário | URL HTTPS permanente |
| Dados | Somente no seu HD | No provedor da nuvem |

## Segurança básica em produção

- `JWT_SECRET` definido no serviço Railway  
- Senhas com bcrypt  
- HTTPS no domínio do provedor  
- Recomendado: trocar senhas demo após a apresentação  
