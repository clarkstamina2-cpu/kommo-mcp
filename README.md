# Kommo CRM MCP Server

Servidor MCP (Model Context Protocol) centralizado para a agência.
Atende vários clientes (multi-tenancy) via variáveis de ambiente da VPS.

- Transporte: **Streamable HTTP**, endpoint `/mcp`
- Acesso: só com o token na URL, `https://<seu-dominio>/mcp?token=<MCP_TOKEN>`
- `/health` é público (para o Easypanel)

---

## Como conectar a IA da equipe

Use a URL completa, com o token: `https://<seu-dominio>/mcp?token=<MCP_TOKEN>`

### Claude (Web ou Desktop)
1. **Personalizar** → **Conectores** → **Adicionar conector personalizado**.
2. Cole a URL completa.

### Claude Code / Antigravity / outros clientes MCP
Adicione um servidor MCP do tipo HTTP com a URL completa. Exemplo de `mcp_config.json`:

```json
{
  "mcpServers": {
    "kommo-mcp": {
      "type": "http",
      "url": "https://<seu-dominio>/mcp?token=<MCP_TOKEN>"
    }
  }
}
```

---

## Deploy no Easypanel

1. Build pelo `Dockerfile`; porta interna `3000`.
2. Variáveis obrigatórias:
   - `MCP_TOKEN`: token de acesso dos conectores (o servidor não sobe sem ele).
   - `KOMMO_<SLUG>_DOMAIN` e `KOMMO_<SLUG>_TOKEN` para cada cliente (veja abaixo).
3. Depois de todo deploy, rode a suíte de testes:

```bash
MCP_URL=https://<seu-dominio> MCP_TOKEN=xxx node test_server.mjs
```

## Como adicionar novos clientes (apenas admins)

Nenhum token da Kommo fica no PC da equipe. A IA descobre os clientes com `get_available_clients` e usa o `client_slug` em todas as ferramentas.

1. No Easypanel, aba **Environment** deste projeto.
2. Adicione `KOMMO_<SLUG>_DOMAIN` e `KOMMO_<SLUG>_TOKEN`, sempre em MAIÚSCULAS e sem espaços.

```env
KOMMO_CLIENTE_ALFA_DOMAIN=clientealfa.kommo.com
KOMMO_CLIENTE_ALFA_TOKEN=eyJhbGci...
```

O slug para a IA será `cliente_alfa`. Slug que não existir devolve erro claro.

3. Salve e clique em **Deploy**.
