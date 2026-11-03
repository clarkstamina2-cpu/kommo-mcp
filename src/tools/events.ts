import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerEventTools(server: McpServer) {
  // 1. Listar Eventos
  server.tool(
    "get_events",
    "Busca a lista de eventos (histórico/timeline) da conta. Útil para consultar detalhadamente o que aconteceu com um lead (mudanças de etapa, anotações, tarefas).",
    {
      page: z.number().default(1).describe("Página dos resultados"),
      limit: z.number().max(100).default(50).describe("Quantidade de eventos (máx 100)"),
      filter_entity_id: z.number().optional().describe("Filtrar eventos por ID da entidade (ex: ID do lead)"),
      filter_entity_type: z.enum(["lead", "contact", "company", "task"]).optional().describe("Filtrar por tipo de entidade"),
      filter_type: z.string().optional().describe("Filtrar por tipo de evento (ex: lead_status_changed)"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, page, limit, filter_entity_id, filter_entity_type, filter_type }) => {
      const api = getApiClient(client_slug);
      try {
        const filter: any = {};
        if (filter_entity_id) filter.entity_id = filter_entity_id;
        if (filter_entity_type) filter.entity_type = filter_entity_type;
        if (filter_type) filter.type = filter_type;

        const response = await api.get("/events", {
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
          return { content: [{ type: "text", text: "Nenhum evento encontrado." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar eventos: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Buscar Evento por ID
  server.tool(
    "get_event_by_id",
    "Busca detalhes de um evento específico usando o ID.",
    {
      id: z.string().describe("ID do evento"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/events/${id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao buscar evento: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. Obter Tipos de Eventos
  server.tool(
    "get_event_types",
    "Busca todos os tipos de eventos disponíveis no sistema (ex: lead_added, task_completed).",
    {  client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get("/events/types");
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao buscar tipos de eventos: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
