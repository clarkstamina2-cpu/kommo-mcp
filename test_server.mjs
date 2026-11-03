/**
 * Suíte de testes do servidor MCP da Kommo (contra um servidor em execução).
 *
 * Uso:
 *   MCP_URL=https://<dominio> MCP_TOKEN=xxx node test_server.mjs
 *   TEST_SLUG=<slug>  -> também lê os funis desse cliente (somente leitura)
 *
 * As chamadas reais à Kommo são SOMENTE de leitura. Nada é criado, alterado ou excluído.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE = (process.env.MCP_URL || "http://localhost:3000").replace(/\/+$/, "");
const TOKEN = process.env.MCP_TOKEN;
if (!TOKEN) throw new Error("defina MCP_TOKEN");
const MIN_TOOLS = 63;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const textOf = (r) => (r.content || []).map((c) => c.text || "").join("");

async function main() {
  let r = await fetch(`${BASE}/health`);
  assert(r.status === 200, `/health falhou: ${r.status}`);
  console.log(`OK  /health público -> ${JSON.stringify(await r.json())}`);

  r = await fetch(`${BASE}/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert(r.status === 401, `sem token deveria ser 401, veio ${r.status}`);
  console.log("OK  sem token -> 401");
  r = await fetch(`${BASE}/mcp?token=errado`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert(r.status === 401, `token errado deveria ser 401, veio ${r.status}`);
  console.log("OK  token errado -> 401");
  r = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: "{}",
  });
  assert(r.status === 401, `token só no header deveria ser 401, veio ${r.status}`);
  console.log("OK  token só no header -> 401 (apenas ?token= é aceito)");
  for (const old of ["/sse", "/message", "/bridge.mjs"]) {
    r = await fetch(`${BASE}${old}?token=${encodeURIComponent(TOKEN)}`);
    assert(r.status === 404, `rota antiga ${old} deveria ser 404, veio ${r.status}`);
  }
  console.log("OK  rotas antigas (/sse, /message, /bridge.mjs) -> 404");

  const client = new Client({ name: "test-server", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp?token=${encodeURIComponent(TOKEN)}`)));
  try {
    const tools = (await client.listTools()).tools.map((t) => t.name);
    assert(tools.length >= MIN_TOOLS, `esperava pelo menos ${MIN_TOOLS} tools, vieram ${tools.length}`);
    assert(new Set(tools).size === tools.length, "há tools duplicadas");
    console.log(`OK  token certo -> ${tools.length} tools registradas`);

    const clients = textOf(await client.callTool({ name: "get_available_clients", arguments: {} }));
    console.log(`OK  get_available_clients -> ${clients.split("\n").filter((l) => l.startsWith("- ")).length} cliente(s)`);

    const bad = await client.callTool({ name: "get_pipelines", arguments: { client_slug: "cliente_inexistente_xyz" } });
    assert(bad.isError && textOf(bad).includes("não está configurado"), `slug inexistente deveria dar erro claro: ${textOf(bad)}`);
    console.log("OK  slug inexistente -> erro claro");

    if (process.env.TEST_SLUG) {
      const p = await client.callTool({ name: "get_pipelines", arguments: { client_slug: process.env.TEST_SLUG } });
      assert(!p.isError, `get_pipelines falhou: ${textOf(p).slice(0, 200)}`);
      console.log(`OK  get_pipelines (Kommo real, ${process.env.TEST_SLUG})`);
    } else {
      console.log("--  leitura real na Kommo NÃO testada (defina TEST_SLUG)");
    }
  } finally {
    await client.close();
  }
  console.log("\nTODOS OS TESTES PASSARAM");
}

main().catch((e) => {
  console.error(`FALHOU: ${e.message}`);
  process.exit(1);
});
