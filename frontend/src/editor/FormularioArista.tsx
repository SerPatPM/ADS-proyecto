/**
 * FormularioArista.tsx — Conecta dos nodos; el tipo y dirección se deducen
 * automáticamente de las etiquetas.
 *
 * El usuario solo selecciona los dos nodos. El sistema analiza sus fórmulas
 * y muestra una vista previa de la conexión que se va a crear antes de
 * confirmar.
 */
import { useState } from 'react';
import type { Nodo, Arista } from '../compartido/tipos';
import { COLOR_ARISTA } from '../compartido/constantes';
import { inferirConexion } from '../compartido/inferirConexion';

interface Props {
  nodos: Nodo[];
  cantidadAristas: number;
  onAgregar: (a: Arista) => void;
}

export function FormularioArista({ nodos, cantidadAristas, onAgregar }: Props) {
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');

  const n1 = nodos.find(n => n.id === id1);
  const n2 = nodos.find(n => n.id === id2);

  // Inferir conexión en tiempo real cuando hay dos nodos seleccionados
  const inferencia = (n1 && n2)
    ? inferirConexion(n1.id, n1.etiqueta, n2.id, n2.etiqueta)
    : null;

  const submit = () => {
    if (!inferencia) return;
    onAgregar({
      id: `arista-${String(cantidadAristas + 1).padStart(3, '0')}`,
      idOrigen: inferencia.idOrigen,
      idDestino: inferencia.idDestino,
      tipo: inferencia.tipo,
      metadatos: {},
    });
    setId1(''); setId2('');
  };

  if (nodos.length < 2) {
    return <p style={{ fontSize: 12, color: '#475569' }}>Agrega al menos 2 nodos para conectarlos.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <label style={lbl}>Primer nodo</label>
      <select value={id1} onChange={e => { setId1(e.target.value); setId2(''); }} style={inp}>
        <option value="">— Seleccionar —</option>
        {nodos.map(n => <option key={n.id} value={n.id}>{n.etiqueta}</option>)}
      </select>

      <label style={lbl}>Segundo nodo</label>
      <select value={id2} onChange={e => setId2(e.target.value)} style={inp} disabled={!id1}>
        <option value="">— Seleccionar —</option>
        {nodos.filter(n => n.id !== id1).map(n => <option key={n.id} value={n.id}>{n.etiqueta}</option>)}
      </select>

      {/* Vista previa de la inferencia */}
      {inferencia && (
        <div style={{
          background: '#0f1f3d', borderRadius: 10, padding: '10px 12px',
          border: `1px solid ${COLOR_ARISTA[inferencia.tipo]}`,
        }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>
            Conexión inferida
          </div>
          <div style={{
            fontSize: 15, color: COLOR_ARISTA[inferencia.tipo],
            fontWeight: 700, letterSpacing: 0.5, marginBottom: 4,
          }}>
            {inferencia.tipo === 'not' ? '↔' : '→'} {inferencia.tipo.toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {inferencia.descripcion}
          </div>
        </div>
      )}

      <button onClick={submit} disabled={!inferencia} style={{
        ...btnPri, opacity: !inferencia ? 0.4 : 1,
      }}>
        Conectar
      </button>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 12, color: '#94a3b8' };
const inp: React.CSSProperties = {
  background: '#0f1f3d', border: '1px solid #1e3a5f', color: 'white',
  borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%',
};
const btnPri: React.CSSProperties = {
  background: '#6366f1', border: 'none', color: 'white',
  borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
};
