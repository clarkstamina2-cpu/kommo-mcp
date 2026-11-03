import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerSalesbotTools(server: McpServer) {
  // 1. Listar Bots
  server.tool(
    "get_salesbots",
    "Busca a lista de Salesbots configurados na conta Kommo.",
    {
      page: z.number().default(1),
      limit: z.number().max(250).default(250),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, page, limit }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get("/bots", {
          params: { page, limit },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhum Salesbot encontrado." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar Salesbots: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Obter um Salesbot pelo ID
  server.tool(
    "get_salesbot_by_id",
    "Busca os detalhes de um Salesbot específico usando o ID.",
    {
      id: z.number().describe("ID do Salesbot"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/bots/${id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao buscar Salesbot: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. Iniciar um Salesbot
  server.tool(
    "launch_salesbot",
    "Inicia um Salesbot (robô) para um Lead ou Contato específico.",
    {
      bot_id: z.number().describe("ID do Salesbot que deve ser iniciado"),
      entity_id: z.number().describe("ID da entidade (ex: ID do Lead ou do Contato)"),
      entity_type: z.enum(["leads", "contacts"]).describe("Tipo de entidade ('leads' ou 'contacts')"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, bot_id, entity_id, entity_type }) => {
      const api = getApiClient(client_slug);
      try {
        const payload = {
          entity_id,
          entity_type,
        };
        const response = await api.post(`/bots/${bot_id}/run`, [payload]);
        return {
          content: [{ type: "text", text: "Salesbot iniciado com sucesso." }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao iniciar Salesbot: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 4. Parar um Salesbot
  server.tool(
    "stop_salesbot",
    "Para a execução de um Salesbot para uma entidade específica.",
    {
      bot_id: z.number().describe("ID do Salesbot a ser parado"),
      entity_id: z.number().describe("ID da entidade (Lead ou Contato)"),
      entity_type: z.enum(["leads", "contacts"]).default("leads"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, bot_id, entity_id, entity_type }) => {
      const api = getApiClient(client_slug);
      try {
        const payload = {
          entity_id,
          entity_type,
        };
        const response = await api.post(`/bots/${bot_id}/stop`, [payload]);
        return {
          content: [{ type: "text", text: "Salesbot parado com sucesso." }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao parar Salesbot: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
