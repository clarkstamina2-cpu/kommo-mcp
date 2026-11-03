import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerLinkTools(server: McpServer) {
  server.tool(
    "link_entities",
    "Vincula duas entidades. Exemplo clássico: vincular um Contato (to_entity_type='contacts') a um Lead (from_entity_type='leads').",
    {
      from_entity_type: z.enum(["leads", "contacts", "companies"]).describe("Tipo da entidade base (quem vai receber o vínculo)"),
      from_entity_id: z.number().describe("ID da entidade base"),
      to_entity_type: z.enum(["leads", "contacts", "companies"]).describe("Tipo da entidade que será anexada"),
      to_entity_id: z.number().describe("ID da entidade que será anexada"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, from_entity_type, from_entity_id, to_entity_type, to_entity_id }) => {
      const api = getApiClient(client_slug);
      try {
        const payload = [
          {
            to_entity_id: to_entity_id,
            to_entity_type: to_entity_type,
            metadata: {
              is_main: true, // Define como contato/empresa principal
            },
          },
        ];

        const response = await api.post(`/${from_entity_type}/${from_entity_id}/link`, payload);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao vincular entidades: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
