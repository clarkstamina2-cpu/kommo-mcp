import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from '../api/client.js';

// Helper para formatar mensagens de erro detalhadas da Kommo
function formatErrorMessage(prefix: string, error: any): string {
  const detail = error.response?.data 
    ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data, null, 2) : error.response.data)
    : error.message;
  return `${prefix}: ${detail}`;
}

export function registerPipelineTools(server: McpServer) {
  // 1. Buscar todos os pipelines (funis)
  server.tool(
    "get_pipelines",
    "Busca a lista de todos os funis de vendas (pipelines) da conta Kommo.",
    {
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get("/leads/pipelines");
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: formatErrorMessage("Erro ao buscar funis", error) }], isError: true };
      }
    }
  );

  // 2. Buscar detalhes de um pipeline específico
  server.tool(
    "get_pipeline_by_id",
    "Busca os detalhes de um funil específico usando o ID (inclui etapas).",
    {
      pipeline_id: z.number().describe("ID do funil"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, pipeline_id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.get(`/leads/pipelines/${pipeline_id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: formatErrorMessage("Erro ao buscar detalhes do funil", error) }], isError: true };
      }
    }
  );

  // 3. Criar Pipeline (Funil) - com suporte nativo a etapas (stages/statuses)
  server.tool(
    "create_pipeline",
    "Cria um novo funil de vendas (pipeline) no CRM Kommo, opcionalmente já incluindo todas as suas etapas (stages/statuses) de uma só vez.",
    {
      name: z.string().describe("Nome do novo funil"),
      sort: z.number().optional().describe("Ordem de exibição"),
      is_main: z.boolean().optional().describe("Se é o funil principal da conta"),
      is_unsorted_on: z.boolean().optional().describe("Se habilita a caixa de entrada de leads de entrada (padrão: false)"),
      stages: z.array(
        z.object({
          name: z.string().describe("Nome da etapa (ex: Contato Inicial, Reunião Agendada)"),
          sort: z.number().optional().describe("Ordem da etapa (ex: 10, 20, 30...)"),
          color: z.string().optional().describe("Cor da etapa em HEX suportada pela Kommo (ex: #99ccff, #ffff99, #ffcc66, #ffcccc, #ccff66, #fffd7f)")
        })
      ).optional().describe("Lista de etapas a serem criadas junto com o funil"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, stages, sort, is_main, is_unsorted_on, name }) => {
      const api = getApiClient(client_slug);
      try {
        const statusList = (stages && stages.length > 0)
          ? stages
          : [{ name: "Contato Inicial", sort: 10 }];

        const payload: any = {
          name,
          sort: sort !== undefined ? sort : 10,
          is_main: is_main !== undefined ? is_main : false,
          is_unsorted_on: is_unsorted_on !== undefined ? is_unsorted_on : false,
          _embedded: {
            statuses: statusList.map((st, index) => ({
              name: st.name,
              sort: st.sort !== undefined ? st.sort : (index + 1) * 10,
              ...(st.color ? { color: st.color } : {})
            }))
          }
        };

        const response = await api.post("/leads/pipelines", [payload]);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: formatErrorMessage("Erro ao criar funil", error) }], isError: true };
      }
    }
  );

  // 4. Atualizar Pipeline
  server.tool(
    "update_pipeline",
    "Atualiza o nome ou propriedades de um funil existente.",
    {
      id: z.number().describe("ID do funil"),
      name: z.string().optional().describe("Novo nome do funil"),
      sort: z.number().optional().describe("Nova ordem de exibição"),
      is_main: z.boolean().optional().describe("Definir se é o funil principal"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, ...pipelineData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.patch(`/leads/pipelines/${pipelineData.id}`, pipelineData);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: formatErrorMessage("Erro ao atualizar funil", error) }], isError: true };
      }
    }
  );

  // 5. Deletar Pipeline
  server.tool(
    "delete_pipeline",
    "Exclui um funil de vendas inteiro.",
    {
      pipeline_id: z.number().describe("ID do funil a ser excluído"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, pipeline_id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.delete(`/leads/pipelines/${pipeline_id}`);
        return { content: [{ type: "text", text: "Pipeline excluído com sucesso." }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: formatErrorMessage("Erro ao excluir funil", error) }], isError: true };
      }
    }
  );

  // 6. Criar Etapas (Stage / Status) no Pipeline (Suporta criação unitária ou em lote)
  server.tool(
    "create_pipeline_stage",
    "Cria uma ou mais etapas (statuses/stages) dentro de um funil de vendas existente.",
    {
      pipeline_id: z.number().describe("ID do funil onde as etapas serão criadas"),
      name: z.string().optional().describe("Nome de etapa única (ex: Em negociação)"),
      sort: z.number().optional().describe("Ordem da etapa (ex: 10, 20, 30)"),
      color: z.string().optional().describe("Cor da etapa em HEX (ex: #ffff99)"),
      stages: z.array(
        z.object({
          name: z.string().describe("Nome da etapa"),
          sort: z.number().optional().describe("Ordem da etapa (ex: 10, 20, 30)"),
          color: z.string().optional().describe("Cor da etapa em HEX (ex: #ffff99)")
        })
      ).optional().describe("Ou lista de múltiplas etapas para criar de uma vez"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, pipeline_id, stages, name, sort, color }) => {
      const api = getApiClient(client_slug);
      try {
        let payload: any[] = [];
        if (stages && stages.length > 0) {
          payload = stages.map((st, index) => ({
            name: st.name,
            sort: st.sort !== undefined ? st.sort : (index + 1) * 10,
            ...(st.color ? { color: st.color } : {})
          }));
        } else if (name) {
          payload = [{
            name,
            ...(sort !== undefined ? { sort } : {}),
            ...(color ? { color } : {})
          }];
        } else {
          return { content: [{ type: "text", text: "Erro: Forneça o 'name' da etapa ou o array 'stages'." }], isError: true };
        }

        const response = await api.post(`/leads/pipelines/${pipeline_id}/statuses`, payload);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: formatErrorMessage("Erro ao criar etapa(s)", error) }], isError: true };
      }
    }
  );

  // 7. Atualizar Etapa
  server.tool(
    "update_pipeline_stage",
    "Atualiza o nome, cor ou ordem de uma etapa de um funil.",
    {
      pipeline_id: z.number().describe("ID do funil"),
      status_id: z.number().describe("ID da etapa (status)"),
      name: z.string().optional().describe("Novo nome da etapa"),
      sort: z.number().optional().describe("Nova ordem da etapa"),
      color: z.string().optional().describe("Nova cor em HEX"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, pipeline_id, status_id, ...stageData }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.patch(`/leads/pipelines/${pipeline_id}/statuses/${status_id}`, stageData);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: formatErrorMessage("Erro ao atualizar etapa", error) }], isError: true };
      }
    }
  );

  // 8. Deletar Etapa
  server.tool(
    "delete_pipeline_stage",
    "Exclui uma etapa específica de um funil.",
    {
      pipeline_id: z.number().describe("ID do funil"),
      status_id: z.number().describe("ID da etapa (status)"),
      client_slug: z.string().describe("Identificador do cliente (slug)")
    },
    async ({ client_slug, pipeline_id, status_id }) => {
      const api = getApiClient(client_slug);
      try {
        const response = await api.delete(`/leads/pipelines/${pipeline_id}/statuses/${status_id}`);
        return { content: [{ type: "text", text: "Etapa excluída com sucesso." }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: formatErrorMessage("Erro ao excluir etapa", error) }], isError: true };
      }
    }
  );
}
