import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

export function registerTaskTools(server: McpServer) {
  // 1. Listar tarefas
  server.tool(
    "get_tasks",
    "Busca uma lista de tarefas na Kommo CRM. Pode filtrar por lead (entity_type=leads), se está concluída, etc.",
    {
      page: z.number().default(1),
      limit: z.number().max(250).default(50),
      is_completed: z.boolean().optional().describe("Filtrar por concluídas ou pendentes"),
      entity_type: z.string().optional().describe("Ex: 'leads', 'contacts', 'companies'"),
      entity_id: z.number().optional().describe("ID da entidade vinculada"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, page, limit, is_completed, entity_type, entity_id }) => {
      const api = getApiClient(client_slug);
      try {
        const filter: any = {};
        if (is_completed !== undefined) filter.is_completed = is_completed ? 1 : 0;
        if (entity_type) filter.entity_type = entity_type;
        if (entity_id) filter.entity_id = entity_id;

        const response = await api.get("/tasks", {
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
        // Se não houver tarefas, a API da Kommo pode retornar 204 No Content
        if (error.response?.status === 204) {
          return { content: [{ type: "text", text: "Nenhuma tarefa encontrada." }] };
        }
        return {
          content: [{ type: "text", text: `Erro ao buscar tarefas: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. Criar uma nova tarefa
  server.tool(
    "create_task",
    "Cria uma nova tarefa no CRM (ex: ligar, reunião, email). Complete_till deve ser um Timestamp UNIX.",
    {
      text: z.string().describe("Descrição/texto da tarefa"),
      complete_till: z.number().describe("Data de vencimento em formato UNIX Timestamp (segundos)"),
      entity_id: z.number().optional().describe("ID do Lead ou Contato ao qual a tarefa pertence"),
      entity_type: z.string().default("leads").describe("Tipo de entidade ('leads', 'contacts', 'companies')"),
      task_type_id: z.number().optional().describe("ID do tipo de tarefa (ex: 1=Call, 2=Meeting)"),
      responsible_user_id: z.number().optional().describe("ID do usuário responsável"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...taskData }) => {
      const api = getApiClient(client_slug);
      try {
        // Envia como array, conforme padrão Kommo
        const response = await api.post("/tasks", [taskData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao criar tarefa: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. Concluir uma tarefa
  server.tool(
    "complete_task",
    "Marca uma tarefa como concluída e, opcionalmente, adiciona um resultado/observação.",
    {
      task_id: z.number().describe("ID da tarefa"),
      result_text: z.string().describe("Texto com o resultado/observação da conclusão da tarefa"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, task_id, result_text }) => {
      const api = getApiClient(client_slug);
      try {
        const payload = {
          id: task_id,
          is_completed: true,
          result: {
            text: result_text,
          },
        };
        const response = await api.patch("/tasks", [payload]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao concluir tarefa: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // 4. Atualizar Tarefa
  server.tool(
    "update_task",
    "Atualiza os detalhes de uma tarefa existente (texto, data, responsável).",
    {
      id: z.number().describe("ID da tarefa"),
      text: z.string().optional().describe("Novo texto"),
      complete_till: z.number().optional().describe("Nova data (UNIX Timestamp)"),
      responsible_user_id: z.number().optional(),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...taskData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.patch("/tasks", [taskData]);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Erro ao atualizar tarefa: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
