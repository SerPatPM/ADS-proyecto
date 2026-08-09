/**
 * FormularioNodo.tsx — Constructor de nodos para fórmulas compuestas.
 *
 * Solo permite usar:
 *   - Botones con las variables ya declaradas (A, B, P, Q…)
 *   - Botones de operadores lógicos (¬, ∧, ∨, →, ↔, (, ))
 *
 * No hay campo de texto libre — la fórmula se construye haciendo clic.
 * Los nodos compuestos NO tienen valor asignado; el valor lo infiere el motor.
 */
import { useState } from 'react';
import type { Nodo, Variable } from '../compartido/tipos';
import { COLOR_BELNAP } from '../compartido/constantes';

const OPERADORES = ['¬', '∧', '∨', '→', '↔', '(', ')'];

interface Props {
  variables: Variable[];
  cantidadNodos: number;
  onAgregar: (nodo: Nodo) => void;
}

export function FormularioNodo({ variables, cantidadNodos, onAgregar }: Props) {
  const [formula, setFormula] = useState('');

  const append = (texto: string) => setFormula(f => f + texto);
  const borrar  = () => setFormula(f => {
    // Borrar último "token": si termina en un nombre de variable multi-char, borrarlo entero
    // Primero intentar quitar la última variable (puede ser multi-char como "P1")
    for (const v of variables.sort((a,b) => b.nombre.length - a.nombre.length)) {
      if (f.endsWith(v.nombre)) return f.slice(0, -v.nombre.length);
    }
    return f.slice(0, -1);
  });
  const limpiar = () => setFormula('');

  const submit = () => {
    if (!formula.trim()) return;
    const idx = cantidadNodos + 1;
    const nodo: Nodo = {
      id: `nodo-${String(idx).padStart(3, '0')}`,
      etiqueta: formula.trim(),
      valor: undefined,   // el motor lo infiere
      posicion: { x: 80 + (idx % 4) * 200, y: 300 + Math.floor(idx / 4) * 180 },
    };
    onAgregar(nodo);
    setFormula('');
  };

  if (variables.length === 0) {
    return (
      <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: 8 }}>
        Primero declara al menos una variable (panel de arriba).
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Vista previa de la fórmula */}
      <div style={{
        background: '#0f1f3d', borderRadius: 10, padding: '10px 14px',
        minHeight: 44, display: 'flex', alignItems: 'center',
        border: formula ? '1px solid #6366f1' : '1px solid #1e3a5f',
      }}>
        {formula
          ? <span style={{ fontSize: 18, color: 'white', fontWeight: 700, letterSpacing: 1 }}>{formula}</span>
          : <span style={{ fontSize: 13, color: '#475569' }}>Haz clic en variables y operadores…</span>
        }
      </div>

      {/* Botones de variables declaradas */}
      <label style={lbl}>Variables declaradas</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {variables.map(v => (
          <button key={v.nombre} onClick={() => append(v.nombre)} style={{
            background: '#162849',
            border: `2px solid ${COLOR_BELNAP[v.valor]}`,
            color: 'white', borderRadius: 8, padding: '6px 14px',
            cursor: 'pointer', fontSize: 16, fontWeight: 700,
          }}>
            {v.nombre}
            <span style={{ fontSize: 9, color: COLOR_BELNAP[v.valor], marginLeft: 4 }}>{v.valor}</span>
          </button>
        ))}
      </div>

      {/* Botones de operadores */}
      <label style={lbl}>Operadores</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {OPERADORES.map(op => (
          <button key={op} onClick={() => append(op)} style={{
            background: '#1e3a5f', border: 'none', color: '#93c5fd',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 18,
          }}>{op}</button>
        ))}
        <button onClick={borrar} disabled={!formula}
          style={{ background: '#2d1b1b', border: 'none', color: '#f87171',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14,
            opacity: formula ? 1 : 0.4 }}>⌫</button>
        <button onClick={limpiar} disabled={!formula}
          style={{ background: '#2d1b1b', border: 'none', color: '#f87171',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12,
            opacity: formula ? 1 : 0.4 }}>✕ Limpiar</button>
      </div>

      <button onClick={submit} disabled={!formula.trim()} style={{
        ...btnPri, opacity: !formula.trim() ? 0.4 : 1,
      }}>
        + Agregar nodo "{formula || '…'}"
      </button>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 12, color: '#94a3b8' };
const btnPri: React.CSSProperties = {
  background: '#6366f1', border: 'none', color: 'white',
  borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
};
