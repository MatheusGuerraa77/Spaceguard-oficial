// src/lib/api.ts
import type { SimulationRequest, SimulationResponse } from "@/types/dto";

export const API_BASE =
  import.meta.env.VITE_SPACEGUARD_API?.replace(/\/$/, "") || "http://localhost:3001";

export class HttpError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message?: string) {
    super(message || `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: any } = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers = new Headers(init.headers);
  // Define JSON por padrão quando enviamos corpo
  if (init.json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  const text = await res.text();

  // Tenta parsear JSON; se falhar, devolve texto bruto
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new HttpError(res.status, data, (data && data.message) || text || "Request failed");
  }

  return data as T;
}

export const http = {
  get:  <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "GET" }),

  post: <T>(path: string, json?: any, init?: RequestInit) =>
    request<T>(path, { ...init, method: "POST", json }),
};

/**
 * API de alto nível da SpaceGuard (named export).
 * Adicione aqui outros métodos conforme for criando endpoints no servidor.
 */
export const api = {
  /**
   * Chama o endpoint POST /simulate do servidor.
   * Espera resposta no formato { ok: boolean, data: SimulationResponse }.
   */
  simulate(payload: SimulationRequest, init?: RequestInit) {
    return http.post<{ ok: boolean; data: SimulationResponse }>("/simulate", payload, init);
  },
};

// Opcional: também exporta como default para quem preferir import default
export default api;
