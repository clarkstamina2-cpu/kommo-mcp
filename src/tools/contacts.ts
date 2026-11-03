import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerContactTools(server: McpServer) {
  server.tool(
    "get_contacts",
    "Busca uma lista de contatos no Kommo CRM.",
    {
      query: z.string().optional().describe("Termo de busca (nome, telefone, email)"),
      page: z.number().default(1),
      limit: z.number().max(250).default(50),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, query, page, limit }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get("/contacts", { params: { query, page, limit } });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao buscar contatos: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_contact",
    "Cria um novo contato no Kommo CRM.",
    {
      first_name: z.string().describe("Primeiro nome do contato"),
      last_name: z.string().optional().describe("Sobrenome"),
      custom_fields_values: z.array(z.any()).optional().describe("Array de campos customizados"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...contactData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.post("/contacts", [contactData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao criar contato: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_contact",
    "Atualiza um contato existente.",
    {
      id: z.number().describe("ID do contato"),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      custom_fields_values: z.array(z.any()).optional(),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...contactData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.patch("/contacts", [contactData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao atualizar contato: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
