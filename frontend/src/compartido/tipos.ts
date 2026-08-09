/**
 * tipos.ts — Modelo EPiC rediseñado.
 *
 * Cambio conceptual: la semántica de las operaciones vive en las ARISTAS, no en los nodos.
 * Los nodos son solo variables/fórmulas etiquetadas con un valor opcional.
 *
 * Aristas:
 *  "and" : verde, origen=compound (A∧B), destino=componente (A)  →  A∧B ⊆ A
 *  "or"  : verde, origen=componente (A), destino=compound (A∨B)  →  A ⊆ A∨B
 *  "not" : rojo bidireccional entre A y ¬A
 *  "ui"  : verde, inclusión directa A→B (implicación)
 */

export type Id = string;
export type ValorBelnap = 'T' | 'F' | 'B' | 'N';
export type TipoArista  = 'and' | 'or' | 'not' | 'ui';

export interface Posicion { x: number; y: number; }

export interface Nodo {
  id: Id;
  etiqueta: string;           // "A", "¬A", "A∧B", etc.
  valor?: ValorBelnap;        // asignado por el usuario; undefined = inferido
  posicion: Posicion;
}

export interface Arista {
  id: Id;
  idOrigen: Id;
  idDestino: Id;
  tipo: TipoArista;
  metadatos: Record<string, string>;
}

export interface Red {
  id: Id;
  nodos: Nodo[];
  aristas: Arista[];
  version: number;
}

export interface ResultadoPropagacion {
  redId: string;
  iteraciones: number;
  valoresNodos: Record<Id, ValorBelnap>;
  convergido: boolean;
  error: string | null;
  descripcion?: string | null;   // regla aplicada en este paso
}

export type FaseSimulacion = 'inactivo' | 'corriendo' | 'pausado' | 'completado' | 'error';

export interface EstadoSimulacion {
  id: string;
  fase: FaseSimulacion;
  pasoActual: number;
  historial: ResultadoPropagacion[];
}

export interface NodoConValor extends Nodo {
  valorActual: ValorBelnap;
}

/** Una variable declarada: nombre atómico con valor Belnap asignado */
export interface Variable {
  nombre: string;     // "A", "B", "P", "Q", etc.
  valor: ValorBelnap; // T / F / B / N
}
