import type { ValorBelnap, TipoArista, Red } from './tipos';

// ── Colores Belnap ────────────────────────────────────────────────────────────
export const COLOR_BELNAP: Record<ValorBelnap, string> = {
  T: '#22c55e', F: '#ef4444', B: '#f59e0b', N: '#6b7280',
};
export const DESC_BELNAP: Record<ValorBelnap, string> = {
  T: 'Verdadero', F: 'Falso', B: 'Contradicción', N: 'Sin evidencia',
};

// ── Colores de aristas ───────────────────────────────────────────────────────
export const COLOR_ARISTA: Record<TipoArista, string> = {
  and: '#22c55e',   // verde
  or:  '#22c55e',   // verde
  not: '#ef4444',   // rojo
  ui:  '#22c55e',   // verde
};

export const DESC_ARISTA: Record<TipoArista, string> = {
  and: 'AND — compound→componente (A∧B→A, flechas verdes)',
  or:  'OR  — componente→compound  (A→A∨B, flechas verdes)',
  not: 'NOT — bidireccional (A↔¬A, flechas rojas)',
  ui:  'UI  — inclusión directa    (A→B, implicación)',
};

export const PALETA = {
  fondo: '#071225', header: '#08152f', tarjeta: '#162849',
  elevado: '#1e293b', borde: '#1e3a5f', texto: '#f1f5f9', acento: '#6366f1',
} as const;

// ── Presets ──────────────────────────────────────────────────────────────────
export const PRESETS: Record<string, Red> = {
  'modus-ponens': {
    id: 'red-mp', version: 1,
    nodos: [
      { id: 'nodo-H',  etiqueta: 'H(s)',       valor: 'T', posicion: { x: 120, y: 260 } },
      { id: 'nodo-HM', etiqueta: 'H(s)→M(s)',  valor: 'T', posicion: { x: 120, y: 380 } },
      { id: 'nodo-M',  etiqueta: 'M(s)',                   posicion: { x: 600, y: 260 } },
    ],
    aristas: [
      // H(s)⊑M(s): inclusión evidencial directa (la implicación induce UI)
      { id: 'arista-1', idOrigen: 'nodo-H', idDestino: 'nodo-M', tipo: 'ui', metadatos: {} },
    ],
  },
  'and-or': {
    id: 'red-and-or', version: 1,
    nodos: [
      { id: 'nodo-A',  etiqueta: 'A',    valor: 'T', posicion: { x: 120, y: 180 } },
      { id: 'nodo-B',  etiqueta: 'B',    valor: 'T', posicion: { x: 120, y: 360 } },
      { id: 'nodo-AB', etiqueta: 'A∧B',             posicion: { x: 440, y: 270 } },
      { id: 'nodo-AvB',etiqueta: 'A∨B',             posicion: { x: 700, y: 270 } },
    ],
    aristas: [
      // AND: flechas DESDE A∧B HACIA componentes (A∧B ⊆ A y A∧B ⊆ B)
      { id: 'arista-1', idOrigen: 'nodo-AB', idDestino: 'nodo-A', tipo: 'and', metadatos: {} },
      { id: 'arista-2', idOrigen: 'nodo-AB', idDestino: 'nodo-B', tipo: 'and', metadatos: {} },
      // OR: flechas DESDE componentes HACIA A∨B (A ⊆ A∨B y B ⊆ A∨B)
      { id: 'arista-3', idOrigen: 'nodo-A', idDestino: 'nodo-AvB', tipo: 'or', metadatos: {} },
      { id: 'arista-4', idOrigen: 'nodo-B', idDestino: 'nodo-AvB', tipo: 'or', metadatos: {} },
    ],
  },
  'not-doble': {
    id: 'red-not', version: 1,
    nodos: [
      { id: 'nodo-A',   etiqueta: 'A',    valor: 'T', posicion: { x: 120, y: 270 } },
      { id: 'nodo-nA',  etiqueta: '¬A',               posicion: { x: 440, y: 270 } },
      { id: 'nodo-nnA', etiqueta: '¬¬A',              posicion: { x: 720, y: 270 } },
    ],
    aristas: [
      // NOT: flechas rojas bidireccionales
      { id: 'arista-1', idOrigen: 'nodo-A',  idDestino: 'nodo-nA',  tipo: 'not', metadatos: {} },
      { id: 'arista-2', idOrigen: 'nodo-nA', idDestino: 'nodo-nnA', tipo: 'not', metadatos: {} },
    ],
  },

  /**
   * Figura 2b del paper EPiC (pág. 17).
   * Premisas: (1) ∀x(B(x)→A(x))  (2) ∃x(¬C(x)∧¬A(x))
   * Conclusión: ∃x(¬C(x)∧¬B(x))
   *
   * 7 pasos — uno por propagación:
   *   0  Estado inicial: ¬C(a)∧¬A(a)=T
   *   1  AND-E → ¬C(a)=T
   *   2  AND-E → ¬A(a)=T
   *   3  NOT   → A(a)=F
   *   4  UI−   → B(a)=F   (de la premisa B→A=T: B⊑A)
   *   5  NOT   → ¬B(a)=T
   *   6  AND-I → ¬C(a)∧¬B(a)=T  ✓ conclusión
   */
  'epic-fig2': {
    id: 'red-epic-fig2', version: 1,
    nodos: [
      { id: 'n01', etiqueta: '¬C(a)∧¬A(a)', valor: 'T', posicion: { x: 100, y: 180 } },
      { id: 'n02', etiqueta: '¬C(a)',                    posicion: { x: 360, y: 100 } },
      { id: 'n03', etiqueta: '¬A(a)',                    posicion: { x: 260, y: 310 } },
      { id: 'n04', etiqueta: 'A(a)',                     posicion: { x: 460, y: 390 } },
      { id: 'n05', etiqueta: 'B(a)',                     posicion: { x: 620, y: 390 } },
      { id: 'n06', etiqueta: '¬B(a)',                    posicion: { x: 710, y: 260 } },
      { id: 'n07', etiqueta: '¬C(a)∧¬B(a)',             posicion: { x: 710, y: 120 } },
    ],
    aristas: [
      // AND-E: premisa conjuntiva → sus componentes
      { id: 'a01', idOrigen: 'n01', idDestino: 'n02', tipo: 'and', metadatos: {} },
      { id: 'a02', idOrigen: 'n01', idDestino: 'n03', tipo: 'and', metadatos: {} },
      // NOT: ¬A(a) ↔ A(a)
      { id: 'a03', idOrigen: 'n03', idDestino: 'n04', tipo: 'not', metadatos: {} },
      // UI: B(a)⊑A(a)  (de la premisa ∀x(B(x)→A(x)))
      { id: 'a04', idOrigen: 'n05', idDestino: 'n04', tipo: 'ui',  metadatos: {} },
      // NOT: B(a) ↔ ¬B(a)
      { id: 'a05', idOrigen: 'n05', idDestino: 'n06', tipo: 'not', metadatos: {} },
      // AND (conclusión recibe de sus componentes)
      { id: 'a06', idOrigen: 'n07', idDestino: 'n02', tipo: 'and', metadatos: {} },
      { id: 'a07', idOrigen: 'n07', idDestino: 'n06', tipo: 'and', metadatos: {} },
    ],
  },
};

// ── Preset: Figura 2 del paper EPiC (pág. 17) ────────────────────────────────
// Premisas:
//   (1) ∀x(B(x)→A(x))   → UI edge B(a)→A(a)
//   (2) ∃x(¬C(x)∧¬A(x)) → nodo ¬C(a)∧¬A(a) con valor T
// Conclusión: ∃x(¬C(x)∧¬B(x))
//
// Pasos esperados (6 reglas):
//   Paso 1: ∧E  ¬C(a)∧¬A(a)=T → ¬C(a)=T
//   Paso 2: ∧E  ¬C(a)∧¬A(a)=T → ¬A(a)=T
//   Paso 3: ¬   ¬A(a)=T → A(a)=F
//   Paso 4: UI- A(a)=F → B(a)=F
//   Paso 5: ¬   B(a)=F → ¬B(a)=T
//   Paso 6: ∧I  ¬C(a)=T ∧ ¬B(a)=T → ¬C(a)∧¬B(a)=T  ✓
PRESETS['epic-fig2'] = {
  id: 'red-epic-fig2', version: 1,
  nodos: [
    // Fila superior
    { id:'nodo-001', etiqueta:'¬C(a)∧¬A(a)', valor:'T', posicion:{x:140, y:190} },
    { id:'nodo-002', etiqueta:'¬C(a)',                   posicion:{x:390, y:120} },
    { id:'nodo-007', etiqueta:'¬C(a)∧¬B(a)',            posicion:{x:720, y:190} },
    // Fila inferior
    { id:'nodo-003', etiqueta:'¬A(a)',                   posicion:{x:230, y:370} },
    { id:'nodo-004', etiqueta:'A(a)',                    posicion:{x:430, y:420} },
    { id:'nodo-005', etiqueta:'B(a)',                    posicion:{x:570, y:420} },
    { id:'nodo-006', etiqueta:'¬B(a)',                   posicion:{x:650, y:360} },
  ],
  aristas: [
    // ∧E: ¬C(a)∧¬A(a) → ¬C(a) y ¬A(a)
    { id:'arista-001', idOrigen:'nodo-001', idDestino:'nodo-002', tipo:'and', metadatos:{} },
    { id:'arista-002', idOrigen:'nodo-001', idDestino:'nodo-003', tipo:'and', metadatos:{} },
    // ¬E: ¬A(a) ↔ A(a)
    { id:'arista-003', idOrigen:'nodo-003', idDestino:'nodo-004', tipo:'not', metadatos:{} },
    // UI: B(a)→A(a)=T  →  UI edge B(a)→A(a); cuando A(a)=F, UI- infiere B(a)=F
    { id:'arista-004', idOrigen:'nodo-005', idDestino:'nodo-004', tipo:'ui',  metadatos:{} },
    // ¬I: B(a) ↔ ¬B(a)
    { id:'arista-005', idOrigen:'nodo-005', idDestino:'nodo-006', tipo:'not', metadatos:{} },
    // ∧I: ¬C(a)∧¬B(a) → ¬C(a) y ¬B(a)
    { id:'arista-006', idOrigen:'nodo-007', idDestino:'nodo-002', tipo:'and', metadatos:{} },
    { id:'arista-007', idOrigen:'nodo-007', idDestino:'nodo-006', tipo:'and', metadatos:{} },
  ],
};
