import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const getApiClient = (clientSlug: string) => {
  const slug = String(clientSlug || "").trim().toUpperCase();
  const KOMMO_DOMAIN = (process.env[`KOMMO_${slug}_DOMAIN`] || "").trim();
  const KOMMO_ACCESS_TOKEN = (process.env[`KOMMO_${slug}_TOKEN`] || "").trim();

  if (!slug || !KOMMO_DOMAIN || !KOMMO_ACCESS_TOKEN) {
    throw new Error(
      `Cliente '${clientSlug}' não está configurado neste servidor. Use get_available_clients para ver os slugs válidos.`
    );
  }

  const api = axios.create({
    baseURL: `https://${KOMMO_DOMAIN}/api/v4`,
    headers: {
      Authorization: `Bearer ${KOMMO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  // Loga só a rota e a resposta da Kommo (nunca o cabeçalho com o token)
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error(`[Kommo API Error] ${error.config?.url}:`, error.response?.data || error.message);
      return Promise.reject(error);
    }
  );

  return api;
};
