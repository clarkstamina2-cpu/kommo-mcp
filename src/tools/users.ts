import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";

export function registerUserTools(server: McpServer) {
  // 1. Obter todos os usuários (Users)
  server.tool(
    "get_users",
    "Retorna a lista de usuários configurados na conta. Útil para encontrar IDs de responsáveis por leads (responsible_user_id).",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      page: z.number().optional().describe("Página de resultados (padrão: 1)"),
      limit: z.number().optional().describe("Quantidade por página (padrão: 50, máx: 250)"),
    },
    async ({ client_slug, page = 1, limit = 50 }) => {
      try {
        const api = getApiClient(client_slug);
        const response = await api.get("/users", {
          params: { page, limit },
        });

        if (response.status === 204) {
          return { content: [{ type: "text", text: "Nenhum usuário encontrado." }] };
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

  // 2. Obter Usuário por ID
  server.tool(
    "get_user_by_id",
    "Retorna os detalhes de um usuário específico pelo seu ID (ex: email, nome, role_id).",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      user_id: z.number().describe("ID do usuário"),
    },
    async ({ client_slug, user_id }) => {
      try {
        const api = getApiClient(client_slug);
        const response = await api.get(`/users/${user_id}`);
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

  // 3. Adicionar Usuários
  server.tool(
    "add_users",
    "Adiciona novos usuários à conta do Kommo.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      users: z.array(
        z.object({
          name: z.string().describe("Nome do usuário"),
          email: z.string().describe("E-mail de login do usuário"),
          password: z.string().describe("Senha inicial para o usuário"),
          rights_role_id: z.number().optional().describe("ID do perfil de permissões (Role). Se não enviado, recebe acesso padrão."),
        })
      ).describe("Lista de usuários a serem criados"),
    },
    async ({ client_slug, users }) => {
      try {
        const api = getApiClient(client_slug);
        const response = await api.post("/users", users);

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

  // 4. Obter todos os perfis de acesso (Roles)
  server.tool(
    "get_roles",
    "Retorna todos os perfis de acesso (Roles) da conta. Use para descobrir qual o 'role_id' de um 'Gerente' ou 'Vendedor'.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
    },
    async ({ client_slug }) => {
      try {
        const api = getApiClient(client_slug);
        // A API de roles não usa paginação no padrão das outras rotas, mas por segurança usamos apenas o endpoint base
        const response = await api.get("/roles");

        if (response.status === 204) {
          return { content: [{ type: "text", text: "Nenhuma role (perfil) encontrada." }] };
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

  // 5. Obter Role por ID
  server.tool(
    "get_role_by_id",
    "Retorna as permissões exatas de um perfil de acesso (Role) específico pelo seu ID.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)"),
      role_id: z.number().describe("ID da Role (perfil de acesso)"),
    },
    async ({ client_slug, role_id }) => {
      try {
        const api = getApiClient(client_slug);
        const response = await api.get(`/roles/${role_id}`);
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
