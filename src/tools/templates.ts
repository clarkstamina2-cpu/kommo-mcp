import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerTemplateTools(server: McpServer) {
  // 1. Listar Templates
  server.tool(
    "get_templates",
    "Busca a lista de modelos de chat (templates), como mensagens de WhatsApp aprovadas (waba).",
    {
      page: z.number().default(1),
      limit: z.number().max(50).default(50),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, page, limit }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get("/chats/templates", {
          params: { page, limit },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhum modelo (template) encontrado." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar modelos: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Criar Templates
  server.tool(
    "create_template",
    "Cria um novo modelo de chat (template). Para WhatsApp, o type costuma ser 'waba'.",
    {
      name: z.string().describe("Nome do modelo"),
      content: z.string().describe("Corpo da mensagem do modelo (pode usar variáveis como {{contact.name}})"),
      type: z.string().default("text").describe("Tipo do modelo (ex: text, waba)"),
      is_editable: z.boolean().default(false).describe("Se usuários podem editar no app da Kommo"),
      waba_category: z.string().optional().describe("Para WhatsApp: UTILITY, AUTHENTICATION, MARKETING"),
      waba_language: z.string().optional().describe("Idioma (ex: pt_BR)"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...templateData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.post("/chats/templates", [templateData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao criar modelo: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. Atualizar Templates
  server.tool(
    "update_template",
    "Atualiza um modelo de chat existente. IMPORTANTE: Limitação da API da Kommo: Você só pode atualizar modelos criados pela integração atual (ou seja, via API usando este mesmo token).",
    {
      id: z.number().describe("ID do modelo"),
      name: z.string().optional(),
      content: z.string().optional(),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...templateData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.patch("/chats/templates", [templateData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao atualizar modelo: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 4. Deletar Templates
  server.tool(
    "delete_template",
    "Exclui um modelo de chat. IMPORTANTE: Limitação da API da Kommo: Você só pode excluir modelos criados pela integração atual (ou seja, via API usando este mesmo token).",
    {
      id: z.number().describe("ID do modelo"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.delete(`/chats/templates/${id}`);
        return {
          content: [{ type: "text", text: "Modelo excluído com sucesso." }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao excluir modelo: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
