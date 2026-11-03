import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerNoteTools(server: McpServer) {
  // 1. Adicionar Nota
  server.tool(
    "add_note",
    "Adiciona uma nota/observação de texto (common note) na linha do tempo de um Lead, Contato ou Empresa.",
    {
      entity_id: z.number().describe("ID da entidade (Lead, Contato, etc)"),
      entity_type: z.enum(["leads", "contacts", "companies"]).default("leads").describe("Tipo da entidade"),
      text: z.string().describe("Texto da nota (pode ser um texto longo ou resumo)"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_id, entity_type, text }) => {
      const api = getApiClient(client_slug);
      try {
        const payload = [
          {
            note_type: "common",
            params: {
              text: text,
            },
          },
        ];

        const response = await api.post(`/${entity_type}/${entity_id}/notes`, payload);
        
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao adicionar nota: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Buscar Notas
  server.tool(
    "get_notes",
    "Busca as notas de um Lead, Contato ou Empresa específico. Útil para o LLM ler o histórico ou resumos anteriores.",
    {
      entity_id: z.number().describe("ID da entidade"),
      entity_type: z.enum(["leads", "contacts", "companies"]).default("leads").describe("Tipo da entidade"),
      page: z.number().default(1),
      limit: z.number().max(250).default(50),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_id, entity_type, page, limit }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/${entity_type}/${entity_id}/notes`, {
          params: { page, limit },
        });
        
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        // Se não houver notas, retorna 204
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhuma nota encontrada para esta entidade." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar notas: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
