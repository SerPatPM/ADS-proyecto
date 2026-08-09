/**
 * FormularioVariable.tsx — Panel para declarar variables atómicas (A, B, P, Q…)
 * y asignarles un valor Belnap inicial.
 *
 * Cuando se agrega una variable, se crea automáticamente un nodo en el grafo
 * con ese nombre como etiqueta y el valor asignado.
 */
import { useState } from 'react';
import type { Variable, ValorBelnap, Nodo } from '../compartido/tipos';
import { COLOR_BELNAP, DESC_BELNAP } from '../compartido/constantes';

const VALORES: ValorBelnap[] = ['T', 'F', 'B', 'N'];

interface Props {
  variables: Variable[];
  cantidadNodos: number;
  onAgregar: (variable: Variable, nodo: Nodo) => void;
  onEliminar: (nombre: string) => void;
}

export function FormularioVariable({ variables, cantidadNodos, onAgregar, onEliminar }: Props) {
  const [nombre, setNombre] = useState('');
  const [valor,  setValor]  = useState<ValorBelnap>('T');

  const submit = () => {
    const n = nombre.trim().toUpperCase();
    if (!n) return;
    if (variables.some(v => v.nombre === n)) return; // ya existe
    const idx = cantidadNodos + 1;
    const variable: Variable = { nombre: n, valor };
    const nodo: Nodo = {
      id: `nodo-${String(idx).padStart(3, '0')}`,
      etiqueta: n,
      valor,
      posicion: { x: 80 + (idx % 5) * 160, y: 120 },
    };
    onAgregar(variable, nodo);
    setNombre('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Variables ya declaradas */}
      {variables.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
          {variables.map(v => (
            <div key={v.nombre} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#0f1f3d', borderRadius: 8, padding: '4px 10px',
              border: `1px solid ${COLOR_BELNAP[v.valor]}40`,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: COLOR_BELNAP[v.valor],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 'bold', color: 'white',
              }}>{v.valor}</div>
              <span style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>{v.nombre}</span>
              <button onClick={() => onEliminar(v.nombre)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario nueva variable */}
      <label style={lbl}>Nombre de la variable</label>
      <input value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())}
        placeholder="Ej. A, B, P, Q"
        maxLength={4}
        style={inp}
        onKeyDown={e => e.key === 'Enter' && submit()} />

      <label style={lbl}>Valor Belnap inicial</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {VALORES.map(v => (
          <button key={v} onClick={() => setValor(v)} style={{
            background: valor === v ? COLOR_BELNAP[v] : '#0f1f3d',
            border: `2px solid ${valor === v ? COLOR_BELNAP[v] : '#1e3a5f'}`,
            color: 'white', borderRadius: 8, padding: '8px 4px',
            cursor: 'pointer', fontSize: 11, fontWeight: valor === v ? 700 : 400,
          }}>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{v}</div>
            <div style={{ fontSize: 9, marginTop: 1 }}>{DESC_BELNAP[v]}</div>
          </button>
        ))}
      </div>

      <button onClick={submit}
        disabled={!nombre.trim() || variables.some(v => v.nombre === nombre.trim().toUpperCase())}
        style={{ ...btnPri, opacity: !nombre.trim() ? 0.4 : 1 }}>
        + Declarar variable {nombre.trim().toUpperCase() || '…'}
        {nombre.trim() && ` = ${valor}`}
      </button>

      {variables.some(v => v.nombre === nombre.trim().toUpperCase()) && (
        <div style={{ fontSize: 11, color: '#f59e0b', textAlign: 'center' }}>
          La variable "{nombre.trim().toUpperCase()}" ya existe
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 12, color: '#94a3b8' };
const inp: React.CSSProperties = {
  background: '#0f1f3d', border: '1px solid #1e3a5f', color: 'white',
  borderRadius: 8, padding: '7px 10px', fontSize: 16, fontWeight: 700,
  outline: 'none', width: '100%', letterSpacing: 2,
};
const btnPri: React.CSSProperties = {
  background: '#6366f1', border: 'none', color: 'white',
  borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
};
