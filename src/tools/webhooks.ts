import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerWebhookTools(server: McpServer) {
  // 1. Listar Webhooks
  server.tool(
    "get_webhooks",
    "Lista os webhooks configurados na conta Kommo.",
    {
      page: z.number().default(1),
      limit: z.number().max(250).default(250),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, page, limit }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get("/webhooks", {
          params: { page, limit },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhum webhook configurado." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar webhooks: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Adicionar (Criar) Webhook
  server.tool(
    "create_webhook",
    "Inscreve um novo webhook. A Kommo enviará POST requests para o destination_url quando os eventos especificados ocorrerem.",
    {
      destination: z.string().describe("A URL que vai receber o webhook (ex: https://meuservidor.com/webhook)"),
      settings: z.array(z.string()).describe("Lista de eventos. Ex: ['add_lead', 'update_lead', 'add_contact']"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, destination, settings }) => {
      const api = getApiClient(client_slug);
      try {
        const payload = {
          destination,
          settings,
        };
        const response = await api.post("/webhooks", [payload]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao criar webhook: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. Deletar Webhook
  server.tool(
    "delete_webhook",
    "Remove um webhook existente. Para remover, você deve passar exatamente a mesma URL (destination) que foi cadastrada.",
    {
      destination: z.string().describe("URL do webhook a ser removido"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, destination }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.delete("/webhooks", {
          data: [{ destination }],
        });
        return {
          content: [{ type: "text", text: "Webhook removido com sucesso." }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao excluir webhook: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
