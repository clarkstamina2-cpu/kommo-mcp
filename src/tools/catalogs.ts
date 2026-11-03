import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";

export function registerCatalogTools(server: McpServer) {
  // 1. Obter lista de catálogos (Lists)
  server.tool(
    "get_catalogs",
    "Retorna a lista de todos os catálogos (Lists) configurados na conta. Muito útil para descobrir o ID de listas de Produtos.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      page: z.number().optional().describe("Página de resultados (padrão: 1)"),
      limit: z.number().optional().describe("Quantidade por página (padrão: 50, máx: 250)"),
    },
    async ({ client_slug, page = 1, limit = 50 }) => {
      try {
        const api = getApiClient(client_slug);
        const response = await api.get("/catalogs", {
          params: { page, limit },
        });

        if (response.status === 204) {
          return { content: [{ type: "text", text: "Nenhum catálogo encontrado." }] };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro: ${error.response?.data?.title || error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Obter Catálogo por ID
  server.tool(
    "get_catalog_by_id",
    "Retorna as configurações e campos (custom_fields) de um catálogo específico.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      catalog_id: z.number().describe("ID do catálogo"),
    },
    async ({ client_slug, catalog_id }) => {
      try {
        const api = getApiClient(client_slug);
        const response = await api.get(`/catalogs/${catalog_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro: ${error.response?.data?.title || error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. Obter Elementos do Catálogo (Produtos)
  server.tool(
    "get_catalog_elements",
    "Retorna a lista de itens/produtos (elements) que estão salvos dentro de um catálogo. Possui campo de busca textual.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      catalog_id: z.number().describe("ID do catálogo onde os elementos estão"),
      query: z.string().optional().describe("Busca textual no nome do produto (opcional)"),
      page: z.number().optional().describe("Página de resultados (padrão: 1)"),
      limit: z.number().optional().describe("Quantidade por página (padrão: 50, máx: 250)"),
    },
    async ({ client_slug, catalog_id, query, page = 1, limit = 50 }) => {
      try {
        const api = getApiClient(client_slug);
        const params: any = { page, limit };
        if (query) params.query = query;

        const response = await api.get(`/catalogs/${catalog_id}/elements`, { params });

        if (response.status === 204) {
          return { content: [{ type: "text", text: "Nenhum elemento encontrado neste catálogo." }] };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro: ${error.response?.data?.title || error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 4. Criar Elementos (Produtos) no Catálogo
  server.tool(
    "create_catalog_elements",
    "Cria novos elementos (ex: produtos) em lote dentro de um catálogo específico.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      catalog_id: z.number().describe("ID do catálogo destino"),
      elements: z.array(
        z.object({
          name: z.string().describe("Nome do elemento (ex: nome do produto)"),
          custom_fields_values: z.array(z.any()).optional().describe("Campos personalizados (ex: preço, descrição)"),
        })
      ).describe("Lista de elementos a serem criados"),
    },
    async ({ client_slug, catalog_id, elements }) => {
      try {
        const api = getApiClient(client_slug);
        const response = await api.post(`/catalogs/${catalog_id}/elements`, elements);

        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro: ${error.response?.data?.title || error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 5. Atualizar Elementos no Catálogo
  server.tool(
    "update_catalog_elements",
    "Atualiza elementos (ex: produtos) em lote dentro de um catálogo específico.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      catalog_id: z.number().describe("ID do catálogo destino"),
      elements: z.array(
        z.object({
          id: z.number().describe("ID do elemento existente"),
          name: z.string().optional().describe("Novo nome do elemento"),
          custom_fields_values: z.array(z.any()).optional().describe("Atualização dos campos personalizados"),
        })
      ).describe("Lista de elementos a serem atualizados"),
    },
    async ({ client_slug, catalog_id, elements }) => {
      try {
        const api = getApiClient(client_slug);
        const response = await api.patch(`/catalogs/${catalog_id}/elements`, elements);

        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro: ${error.response?.data?.title || error.message}` }],
          isError: true,
        };
      }
    }
  );
}
