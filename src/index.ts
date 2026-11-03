import { timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";

import { registerLeadTools } from "./tools/leads.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerPipelineTools } from "./tools/pipelines.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerNoteTools } from "./tools/notes.js";
import { registerChatTools } from "./tools/chats.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerLinkTools } from "./tools/links.js";
import { registerMetadataTools } from "./tools/metadata.js";
import { registerTemplateTools } from "./tools/templates.js";
import { registerSalesbotTools } from "./tools/salesbots.js";
import { registerWebhookTools } from "./tools/webhooks.js";
import { registerEventTools } from "./tools/events.js";
import { registerAgencyTools } from "./tools/agency.js";
import { registerCatalogTools } from "./tools/catalogs.js";
import { registerUserTools } from "./tools/users.js";

dotenv.config();

// Falha ao iniciar se faltar variável obrigatória (configurar no Easypanel).
const MCP_TOKEN = (process.env.MCP_TOKEN || "").trim();
if (!MCP_TOKEN) {
  console.error("ERRO: variável de ambiente obrigatória ausente: MCP_TOKEN (configure no Easypanel).");
  process.exit(1);
}
const PORT = Number(process.env.PORT || 3000);

function buildServer(): McpServer {
  const server = new McpServer({ name: "Kommo-CRM-MCP-Agency", version: "3.0.0" });
  registerAgencyTools(server);
  registerLeadTools(server);
  registerContactTools(server);
  registerPipelineTools(server);
  registerTaskTools(server);
  registerNoteTools(server);
  registerChatTools(server);
  registerCompanyTools(server);
  registerLinkTools(server);
  registerMetadataTools(server);
  registerTemplateTools(server);
  registerSalesbotTools(server);
  registerWebhookTools(server);
  registerEventTools(server);
  registerCatalogTools(server);
  registerUserTools(server);
  return server;
}

// Aceita só /mcp?token=<MCP_TOKEN>. Comparação em tempo constante; nunca logar a URL completa (contém o token).
function tokenNaURL(req: Request, res: Response, next: NextFunction) {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const a = Buffer.from(token);
  const b = Buffer.from(MCP_TOKEN);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    console.warn(`[401] Acesso bloqueado em ${req.path} (IP: ${req.ip}) - token ausente ou invalido`);
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

const app = express();
app.set("trust proxy", true);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", transport: "streamable-http", endpoint: "/mcp" });
});

app.use(tokenNaURL);
app.use(express.json({ limit: "5mb" }));

// Streamable HTTP sem sessão: um servidor novo por requisição, nada guardado em memória.
app.post("/mcp", async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error: any) {
    console.error("[POST /mcp] Erro:", error?.message || error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});

app.all("/mcp", (_req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor MCP da Kommo (Streamable HTTP) na porta ${PORT}, endpoint /mcp`);
});
