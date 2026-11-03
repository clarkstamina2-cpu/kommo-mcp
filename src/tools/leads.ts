import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerLeadTools(server: McpServer) {
  // 1. Buscar Leads
  server.tool(
    "get_leads",
    "Busca uma lista de leads no Kommo CRM. Permite paginação e busca por termo.",
    {
      query: z.string().optional().describe("Termo de busca (ex: nome, email)"),
      page: z.number().default(1).describe("Página dos resultados"),
      limit: z.number().max(250).default(50).describe("Quantidade de leads por página"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, query, page, limit }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get("/leads", { params: { query, page, limit } });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao buscar leads: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Buscar Lead Específico
  server.tool(
    "get_lead_by_id",
    "Busca os detalhes de um lead específico usando o ID.",
    {
      id: z.number().describe("ID do lead"),
      with: z.string().optional().describe("Relações para incluir (ex: contacts, companies)"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, id, ...params }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/leads/${id}`, { params });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao buscar lead: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. Criar Lead
  server.tool(
    "create_lead",
    "Cria um novo lead no Kommo CRM.",
    {
      name: z.string().describe("Nome do lead"),
      price: z.number().optional().describe("Valor do lead"),
      pipeline_id: z.number().optional().describe("ID do pipeline"),
      status_id: z.number().optional().describe("ID da etapa (status)"),
      custom_fields_values: z.array(z.any()).optional().describe("Array de campos customizados (descubra o ID usando get_custom_fields)"),
      _embedded: z.any().optional().describe("Metadados adicionais, como tags: { tags: [{ name: 'VIP' }] }"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...leadData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.post("/leads", [leadData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao criar lead: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 4. Atualizar Lead (Ex: Mover de Etapa)
  server.tool(
    "update_lead",
    "Atualiza um lead existente no Kommo CRM. Muito usado para mover o lead de funil ou etapa, adicionar tags ou atualizar campos.",
    {
      id: z.number().describe("ID do lead que será atualizado"),
      name: z.string().optional().describe("Novo nome do lead"),
      price: z.number().optional().describe("Novo valor"),
      pipeline_id: z.number().optional().describe("ID do novo pipeline (funil)"),
      status_id: z.number().optional().describe("ID do novo status (etapa)"),
      custom_fields_values: z.array(z.any()).optional().describe("Array de campos customizados para atualizar"),
      _embedded: z.any().optional().describe("Metadados adicionais para atualizar, como tags"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...leadData }) => {
      const api = getApiClient(client_slug);
      try {
        // Kommo espera um array de objetos para atualização (PATCH)
        const response = await api.patch("/leads", [leadData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao atualizar lead: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 5. Criação Complexa de Lead
  server.tool(
    "create_complex_lead",
    "Cria um lead de forma 'complexa', permitindo anexar imediatamente contatos, empresas, tags, etc. Tudo em uma só requisição e suportando regras de controle de duplicados.",
    {
      name: z.string().optional().describe("Nome do lead"),
      price: z.number().optional().describe("Valor do lead"),
      pipeline_id: z.number().optional().describe("ID do pipeline"),
      status_id: z.number().optional().describe("ID da etapa (status)"),
      custom_fields_values: z.array(z.any()).optional().describe("Campos customizados do lead"),
      _embedded: z.object({
        contacts: z.array(z.any()).optional().describe("Contatos a serem criados/vinculados (limite 1)"),
        companies: z.array(z.any()).optional().describe("Empresas a serem criadas/vinculadas (limite 1)"),
        tags: z.array(z.any()).optional().describe("Tags a serem adicionadas"),
      }).optional().describe("Dados relacionados (contatos, empresas, tags)"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...leadData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.post("/leads/complex", [leadData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao criar lead complexo: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
