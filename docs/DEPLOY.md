# Publicação em nuvem (24h online)

Este projeto está preparado para rodar **sempre online** em um servidor na nuvem (não depende do seu PC).

## Opção recomendada: Render (1 clique pelo GitHub)

1. Acesse: https://dashboard.render.com/select-repo?type=blueprint  
2. Conecte a conta GitHub `gabrielposia-netizen`  
3. Selecione o repositório **gestao-frota-jsl**  
4. Confirme o Blueprint (`render.yaml`)  
5. Clique em **Apply**

O Render cria:
- PostgreSQL na nuvem  
- App web (frontend + API juntos)  

Ao final, você recebe uma URL permanente, por exemplo:

`https://gestao-frota-jsl.onrender.com`

### Login demo
- admin@frota.jsl / admin123  

### Observações do plano Free do Render
- O Web Service pode “dormir” após ~15 min sem acesso (~30–60s para acordar).
- O Postgres Free expira em **30 dias** (depois precisa upgrade ou recriar).
- Para **ficar acordado 24h** de verdade: no painel, mude o Web Service para **Starter** (pago) e o banco para um plano pago.

## Opção alternativa: Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway add --database postgres
railway up
```

## O que muda na arquitetura

| Item | Antes (seu PC) | Agora (nuvem) |
|------|----------------|---------------|
| Banco | Pasta local `.pgdata` | PostgreSQL gerenciado |
| App | Precisa PC ligado | Roda 24h no servidor |
| Link | Túnel temporário | URL HTTPS permanente |
| Dados | Somente no seu HD | No provedor da nuvem |

## Segurança básica em produção

- `JWT_SECRET` gerado automaticamente no Render  
- Senhas com bcrypt  
- HTTPS no domínio do provedor  
- Recomendado: trocar senhas demo após a apresentação  
