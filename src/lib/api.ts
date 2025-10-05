// src/lib/api.ts
import type { SimulationRequest, SimulationResponse } from "@/types/dto";

/** Base da API (remove barra final se houver) */
export const API_BASE =
  (import.meta.env.VITE_SPACEGUARD_API?.replace(/\/$/, "") ??
    "http://localhost:3001");

/** Erro HTTP com payload parseado */
export class HttpError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message?: string) {
    super(message || `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * Função base de requisição.
 * - Se `init.json` for fornecido, envia como JSON e seta Content-Type.
 * - Sempre tenta parsear JSON da resposta; se falhar, devolve texto puro.
 * - Lança HttpError em respostas não-2xx.
 */
async function request<T>(
  path: string,
  init: RequestInit & { json?: any } = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers = new Headers(init.headers);
  // Aceita JSON por padrão
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  // Se vamos enviar corpo JSON, garante Content-Type
  if (init.json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
  } catch (err: any) {
    // Erros de rede (sem resposta HTTP)
    throw new HttpError(0, null, err?.message || "Network error");
  }

  const text = await res.text();

  // Tenta parsear JSON; se não for JSON retorna texto
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    // Mensagem amigável: usa "message" do JSON, se houver
    const msg =
      (data && typeof data === "object" && (data.message as string)) ||
      text ||
      "Request failed";
    throw new HttpError(res.status, data, msg);
  }

  return data as T;
}

/** Atalhos HTTP tipados */
export const http = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "GET" }),

  post: <T>(path: string, json?: any, init?: RequestInit) =>
    request<T>(path, { ...init, method: "POST", json }),
};

/**
 * API de alto nível da SpaceGuard.
 * Adicione aqui outros métodos conforme for criando endpoints no servidor.
 */
export const api = {
  /**
   * POST /simulate
   * Retorna { ok: boolean; data: SimulationResponse }
   */
  simulate(
    payload: SimulationRequest,
    init?: RequestInit
  ): Promise<{ ok: boolean; data: SimulationResponse }> {
    return http.post<{ ok: boolean; data: SimulationResponse }>(
      "/simulate",
      payload,
      init
    );
  },
};

// Opcional: export default para quem preferir import default
export default api;
