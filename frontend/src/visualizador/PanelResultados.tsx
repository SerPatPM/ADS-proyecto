import type { NodoConValor, ResultadoPropagacion } from '../compartido/tipos';
import { COLOR_BELNAP, DESC_BELNAP } from '../compartido/constantes';

interface Props {
  nodos: NodoConValor[];
  pasoPrevio?: ResultadoPropagacion | null;  // para detectar qué nodo cambió
  pasoActual:  ResultadoPropagacion;
}

export function PanelResultados({ nodos, pasoPrevio, pasoActual }: Props) {
  // Detectar qué nodo cambió en este paso (comparando con el previo)
  const nodesChanged = new Set<string>();
  if (pasoPrevio) {
    for (const n of nodos) {
      if ((pasoPrevio.valoresNodos[n.id] ?? 'N') !== (pasoActual.valoresNodos[n.id] ?? 'N')) {
        nodesChanged.add(n.id);
      }
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Regla que disparó en este paso */}
      {pasoActual.descripcion && (
        <div style={{
          background: pasoActual.convergido ? '#0d2b1a' : '#0f1f3d',
          border: `1px solid ${pasoActual.convergido ? '#22c55e' : '#6366f1'}`,
          borderRadius:10, padding:'10px 12px',
        }}>
          <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>
            {pasoActual.iteraciones===0 ? 'Estado inicial' : `Regla aplicada · Paso ${pasoActual.iteraciones}`}
          </div>
          <div style={{ fontSize:14, color: pasoActual.convergido ? '#22c55e' : '#a5b4fc', fontWeight:700 }}>
            {pasoActual.descripcion}
          </div>
          {pasoActual.convergido && (
            <div style={{ fontSize:11, color:'#22c55e', marginTop:4 }}>
              ✓ Punto fijo alcanzado — propagación completa
            </div>
          )}
        </div>
      )}

      {/* Valores actuales de cada nodo */}
      <div style={{ background:'#162849', borderRadius:12, padding:'12px 14px' }}>
        <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
          Estado actual de nodos
        </div>
        {nodos.map(n => {
          const cambio = nodesChanged.has(n.id);
          return (
            <div key={n.id} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'6px 8px', marginBottom:4, borderRadius:8,
              background: cambio ? '#1a2f1a' : 'transparent',
              border: cambio ? '1px solid #22c55e40' : '1px solid transparent',
              transition: 'background 0.3s',
            }}>
              <div>
                <div style={{ fontSize:13, color: cambio ? 'white' : '#cbd5e1', fontWeight: cambio ? 700 : 400 }}>
                  {n.etiqueta}
                  {cambio && <span style={{ fontSize:9, color:'#22c55e', marginLeft:6 }}>← CAMBIÓ</span>}
                  {n.valor !== undefined && !cambio && (
                    <span style={{ fontSize:9, color:'#64748b', marginLeft:4 }}>(asignado)</span>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{
                  width:26, height:26, borderRadius:'50%',
                  background: COLOR_BELNAP[n.valorActual],
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:'bold', fontSize:13, color:'white',
                  boxShadow: cambio ? `0 0 8px ${COLOR_BELNAP[n.valorActual]}` : 'none',
                }}>
                  {n.valorActual}
                </div>
                <span style={{ fontSize:10, color:'#64748b', width:80 }}>{DESC_BELNAP[n.valorActual]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div style={{ background:'#162849', borderRadius:12, padding:'12px 14px' }}>
        <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
          Valores Belnap
        </div>
        {(['T','F','B','N'] as const).map(v => (
          <div key={v} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:COLOR_BELNAP[v],
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:'bold', color:'white', flexShrink:0 }}>{v}</div>
            <span style={{ fontSize:11, color:'#94a3b8' }}>{DESC_BELNAP[v]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
