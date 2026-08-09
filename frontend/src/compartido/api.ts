import type { Red, ResultadoPropagacion, EstadoSimulacion } from './tipos';
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function _post<T>(ruta: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${ruta}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}
async function _put<T>(ruta: string): Promise<T> {
  const res = await fetch(`${BASE}${ruta}`, { method: 'PUT' });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

export async function calcularRed(red: Red): Promise<ResultadoPropagacion> {
  return _post(`/api/v1/redes/${red.id}/calcular`, red);
}
export async function iniciarSimulacion(red: Red): Promise<EstadoSimulacion> {
  return _post('/api/v1/simulaciones', { red });
}
export async function avanzarPaso(id: string): Promise<{ pasoActual: number; avanzado: boolean }> {
  return _put(`/api/v1/simulaciones/${id}/avanzar`);
}
export async function retrocederPaso(id: string): Promise<{ pasoActual: number; avanzado: boolean }> {
  return _put(`/api/v1/simulaciones/${id}/retroceder`);
}
export async function pausarSimulacion(id: string): Promise<void> { await _put(`/api/v1/simulaciones/${id}/pausar`); }
export async function reanudarSimulacion(id: string): Promise<void> { await _put(`/api/v1/simulaciones/${id}/reanudar`); }
