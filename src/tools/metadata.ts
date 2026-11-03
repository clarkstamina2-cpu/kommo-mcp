import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerMetadataTools(server: McpServer) {
  // 1. Buscar Campos Customizados (Custom Fields)
  server.tool(
    "get_custom_fields",
    "Busca a estrutura de campos customizados da conta (ex: descobrir o ID do campo 'CPF' ou 'Origem' para preencher um Lead/Contato).",
    {
      entity_type: z.enum(["leads", "contacts", "companies"]).default("leads").describe("Tipo de entidade para listar os campos"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/${entity_type}/custom_fields`);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhum campo customizado encontrado." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar campos customizados: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Buscar Tags (Etiquetas)
  server.tool(
    "get_tags",
    "Busca as tags (etiquetas) existentes na conta para uma entidade.",
    {
      entity_type: z.enum(["leads", "contacts", "companies"]).default("leads").describe("Tipo de entidade para listar as tags"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/${entity_type}/tags`);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhuma tag encontrada." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar tags: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. Criar Campo Customizado
  server.tool(
    "create_custom_field",
    "Cria um novo campo customizado para uma entidade (ex: leads). Tipos: text, numeric, checkbox, select, date, etc.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      name: z.string().describe("Nome do campo"),
      type: z.string().default("text").describe("Tipo do campo (ex: text, numeric, select)"),
      group_id: z.string().optional().describe("ID do grupo de campos"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type, ...fieldData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.post(`/${entity_type}/custom_fields`, [fieldData]);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
      }
    }
  );

  // 4. Buscar Campo Customizado por ID
  server.tool(
    "get_custom_field_by_id",
    "Busca detalhes de um campo customizado específico usando o ID.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      id: z.number().describe("ID do campo customizado"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type, id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/${entity_type}/custom_fields/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
      }
    }
  );

  // 5. Atualizar Campo Customizado
  server.tool(
    "update_custom_field",
    "Atualiza um campo customizado existente.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      id: z.number().describe("ID do campo customizado a ser atualizado"),
      name: z.string().optional().describe("Novo nome"),
      group_id: z.string().optional(),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type, id, ...fieldData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.patch(`/${entity_type}/custom_fields/${id}`, fieldData);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        // Fallback para patch em lote se a API não suportar patch por id diretamente
        try {
          const fallbackResponse = await api.patch(`/${entity_type}/custom_fields`, [{ id, ...fieldData }]);
          return { content: [{ type: "text", text: JSON.stringify(fallbackResponse.data, null, 2) }] };
        } catch (fallbackError: any) {
          return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        }
      }
    }
  );

  // 6. Excluir Campo Customizado
  server.tool(
    "delete_custom_field",
    "Exclui um campo customizado existente.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      id: z.number().describe("ID do campo customizado"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type, id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.delete(`/${entity_type}/custom_fields/${id}`);
        return { content: [{ type: "text", text: "Campo excluído com sucesso." }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
      }
    }
  );

  // 7. Grupos de Campos - Listar
  server.tool(
    "get_custom_field_groups",
    "Lista os grupos de campos (abas/seções) de uma entidade.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/${entity_type}/custom_fields/groups`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
      }
    }
  );

  // 8. Grupos de Campos - Criar
  server.tool(
    "create_custom_field_group",
    "Cria um novo grupo de campos (aba/seção) na entidade.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      name: z.string().describe("Nome do novo grupo de campos"),
      sort: z.number().optional().describe("Ordem de exibição"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type, ...groupData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.post(`/${entity_type}/custom_fields/groups`, [groupData]);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
      }
    }
  );

  // 9. Grupos de Campos - Obter por ID
  server.tool(
    "get_custom_field_group_by_id",
    "Obtém detalhes de um grupo de campos de entidade por ID.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      id: z.string().describe("ID do grupo de campos"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type, id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/${entity_type}/custom_fields/groups/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
      }
    }
  );

  // 10. Grupos de Campos - Atualizar
  server.tool(
    "update_custom_field_group",
    "Atualiza um grupo de campos (aba/seção) existente.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      id: z.string().describe("ID do grupo de campos a ser atualizado"),
      name: z.string().optional().describe("Novo nome do grupo"),
      sort: z.number().optional().describe("Nova ordem de exibição"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type, id, ...groupData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.patch(`/${entity_type}/custom_fields/groups/${id}`, groupData);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        try {
          const fallbackResponse = await api.patch(`/${entity_type}/custom_fields/groups`, [{ id, ...groupData }]);
          return { content: [{ type: "text", text: JSON.stringify(fallbackResponse.data, null, 2) }] };
        } catch (fallbackError: any) {
          return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        }
      }
    }
  );

  // 11. Grupos de Campos - Excluir
  server.tool(
    "delete_custom_field_group",
    "Exclui um grupo de campos.",
    {
      entity_type: z.enum(["leads", "contacts", "companies", "catalogs"]).default("leads"),
      id: z.string().describe("ID do grupo de campos a ser excluído"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, entity_type, id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.delete(`/${entity_type}/custom_fields/groups/${id}`);
        return { content: [{ type: "text", text: "Grupo de campos excluído com sucesso." }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
      }
    }
  );
}
