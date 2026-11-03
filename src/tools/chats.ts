import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerChatTools(server: McpServer) {
  // 1. Listar conversas (Talks)
  server.tool(
    "get_conversations",
    "Busca a lista de conversas (Talks) na Kommo. Você pode filtrar por contact_id para ver os chats de um cliente específico.",
    {
      page: z.number().default(1),
      limit: z.number().max(250).default(50),
      contact_id: z.number().optional().describe("ID do contato para filtrar as conversas dele"),
      entity_id: z.number().optional().describe("ID do Lead vinculado à conversa"),
      entity_type: z.enum(["lead"]).optional().describe("Usar junto com entity_id"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, page, limit, contact_id, entity_id, entity_type }) => {
      const api = getApiClient(client_slug);
      try {
        const filter: any = {};
        if (contact_id) filter["contact_id"] = [contact_id];
        if (entity_id) {
          filter["entity_id"] = [entity_id];
          filter["entity_type"] = entity_type || "lead";
        }

        const response = await api.get("/talks", {
          params: {
            page,
            limit,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
          },
        });
        
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhuma conversa encontrada." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar conversas: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // NOTA: Para implementar o 'get_chat_history' (que lê o conteúdo das mensagens), 
  // a Kommo exige a "Chats API", que funciona de um jeito completamente diferente
  // usando HMAC-SHA1 signatures e um "Channel Secret" em vez do Token Bearer padrão.
}
