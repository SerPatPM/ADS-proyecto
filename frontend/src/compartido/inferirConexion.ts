/**
 * inferirConexion.ts — Deduce el tipo y dirección de una arista a partir
 * de las etiquetas de los dos nodos que el usuario quiere conectar.
 *
 * Reglas (en orden de prioridad):
 *
 * 1. NOT   — una etiqueta es ¬ de la otra (bidireccional, rojo)
 *            Ej: "A" ↔ "¬A"
 *
 * 2. AND   — una etiqueta es una conjunción (∧) que contiene a la otra
 *            como componente directa. Flecha DESDE la conjunción HACIA
 *            el componente (A∧B ⊆ A).
 *            Ej: "A" y "A∧B"  →  arista AND de origen "A∧B" a destino "A"
 *
 * 3. OR    — una etiqueta es una disyunción (∨) que contiene a la otra.
 *            Flecha DESDE el componente HACIA la disyunción (A ⊆ A∨B).
 *            Ej: "A" y "A∨B"  →  arista OR de origen "A" a destino "A∨B"
 *
 * 4. UI    — cualquier otro par (inclusión evidencial directa, implicación).
 *            Flecha del primero hacia el segundo.
 */

import type { TipoArista } from './tipos';

export interface ResultadoInferencia {
  tipo: TipoArista;
  idOrigen: string;
  idDestino: string;
  descripcion: string;  // texto explicativo para mostrar al usuario
}

/** Separa una fórmula por un operador de nivel raíz (ignora paréntesis anidados). */
function separarPor(formula: string, op: string): string[] {
  const partes: string[] = [];
  let nivel = 0;
  let actual = '';
  for (const ch of formula) {
    if (ch === '(') { nivel++; actual += ch; }
    else if (ch === ')') { nivel--; actual += ch; }
    else if (ch === op && nivel === 0) {
      partes.push(actual.trim());
      actual = '';
    } else {
      actual += ch;
    }
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes;
}

/** Quita paréntesis externos si los hay: "(A∧B)" → "A∧B" */
function quitarParens(s: string): string {
  const t = s.trim();
  if (t.startsWith('(') && t.endsWith(')')) return t.slice(1, -1).trim();
  return t;
}

/** Comprueba si `candidato` aparece como componente directo en la fórmula
 *  al dividirla por el operador dado. */
function esComponente(formula: string, candidato: string, op: string): boolean {
  const partes = separarPor(quitarParens(formula), op);
  return partes.length > 1 && partes.some(p => quitarParens(p) === quitarParens(candidato));
}

export function inferirConexion(
  id1: string, etiqueta1: string,
  id2: string, etiqueta2: string,
): ResultadoInferencia {
  const e1 = etiqueta1.trim();
  const e2 = etiqueta2.trim();

  // ── NOT ──────────────────────────────────────────────────────────────────
  if (e2 === '¬' + e1 || e1 === '¬' + e2 ||
      e2 === '¬(' + e1 + ')' || e1 === '¬(' + e2 + ')') {
    return {
      tipo: 'not', idOrigen: id1, idDestino: id2,
      descripcion: `${e1} ↔ ${e2} (NOT — bidireccional rojo)`,
    };
  }

  // ── AND — e2 es conjunción que contiene a e1 ─────────────────────────────
  if (esComponente(e2, e1, '∧')) {
    return {
      tipo: 'and', idOrigen: id2, idDestino: id1,
      descripcion: `${e2} → ${e1}  (AND — ${e2} ⊆ ${e1})`,
    };
  }
  // AND — e1 es conjunción que contiene a e2
  if (esComponente(e1, e2, '∧')) {
    return {
      tipo: 'and', idOrigen: id1, idDestino: id2,
      descripcion: `${e1} → ${e2}  (AND — ${e1} ⊆ ${e2})`,
    };
  }

  // ── OR — e2 es disyunción que contiene a e1 ──────────────────────────────
  if (esComponente(e2, e1, '∨')) {
    return {
      tipo: 'or', idOrigen: id1, idDestino: id2,
      descripcion: `${e1} → ${e2}  (OR — ${e1} ⊆ ${e2})`,
    };
  }
  // OR — e1 es disyunción que contiene a e2
  if (esComponente(e1, e2, '∨')) {
    return {
      tipo: 'or', idOrigen: id2, idDestino: id1,
      descripcion: `${e2} → ${e1}  (OR — ${e2} ⊆ ${e1})`,
    };
  }

  // ── UI (implicación directa por defecto) ─────────────────────────────────
  return {
    tipo: 'ui', idOrigen: id1, idDestino: id2,
    descripcion: `${e1} → ${e2}  (inclusión evidencial directa)`,
  };
}
