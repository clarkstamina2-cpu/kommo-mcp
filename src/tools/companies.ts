import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerCompanyTools(server: McpServer) {
  server.tool(
    "get_companies",
    "Busca uma lista de empresas cadastradas no CRM.",
    {
      query: z.string().optional().describe("Termo de busca (nome da empresa)"),
      page: z.number().default(1),
      limit: z.number().max(250).default(50),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, query, page, limit }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get("/companies", { params: { query, page, limit } });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhuma empresa encontrada." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar empresas: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_company",
    "Cria uma nova empresa no CRM.",
    {
      name: z.string().describe("Nome da empresa"),
      custom_fields_values: z.array(z.any()).optional().describe("Array de campos customizados"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...companyData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.post("/companies", [companyData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao criar empresa: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_company",
    "Atualiza uma empresa existente.",
    {
      id: z.number().describe("ID da empresa"),
      name: z.string().optional(),
      custom_fields_values: z.array(z.any()).optional(),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...companyData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.patch("/companies", [companyData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao atualizar empresa: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
