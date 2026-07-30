# Como acessar o Gestão de Frota JSL

## Links rápidos

| Canal | Link |
|-------|------|
| **Web (neste PC)** | http://localhost:5173 |
| **Celular (mesma Wi‑Fi)** | http://192.168.1.6:5173 |
| **Internet (túnel público)** | https://gestao-frota-jsl.loca.lt |

> O link público funciona enquanto o túnel e o app estiverem rodando neste computador.
> Na primeira abertura do localtunnel, pode aparecer uma tela de confirmação — clique em **Continue**.

## Logins de demonstração

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@frota.jsl | admin123 |
| Supervisor | supervisor@frota.jsl | super123 |
| Operador | operador@frota.jsl | oper123 |

## Materiais para a gerência

- Apresentação executiva: `docs/apresentacao-gerencia.html` (abra no navegador, use setas ← →)
- Tutorial interativo: `docs/tutorial-app.html`
- Vídeo tutorial: `docs/video/tutorial-gestao-frota.mp4`

## Subir o túnel novamente

```bash
npx localtunnel --port 5173 --subdomain gestao-frota-jsl
```
