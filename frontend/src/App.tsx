import { useState, useRef, useCallback, useEffect } from 'react';
import type { Nodo, Arista, Red, EstadoSimulacion, NodoConValor, FaseSimulacion, ValorBelnap, Variable } from './compartido/tipos';
import { PRESETS, PALETA, COLOR_BELNAP, DESC_BELNAP } from './compartido/constantes';
import { iniciarSimulacion } from './compartido/api';
import { CanvasEditor }        from './editor/CanvasEditor';
import { FormularioVariable }  from './editor/FormularioVariable';
import { FormularioNodo }      from './editor/FormularioNodo';
import { FormularioArista }    from './editor/FormularioArista';
import { ControlesSimulacion } from './visualizador/ControlesSimulacion';
import { PanelResultados }     from './visualizador/PanelResultados';

type Tab = 'editor' | 'resultados';
const VALORES_BELNAP: ValorBelnap[] = ['T', 'F', 'B', 'N'];

export default function App() {
  const [variables,       setVariables]       = useState<Variable[]>([]);
  const [nodos,           setNodos]           = useState<Nodo[]>([]);
  const [aristas,         setAristas]         = useState<Arista[]>([]);
  const [preset,          setPreset]          = useState('');
  const [nodoSelec,       setNodoSelec]       = useState<string | null>(null);
  const [simulacion,      setSimulacion]      = useState<EstadoSimulacion | null>(null);
  const [pasoVisible,     setPasoVisible]     = useState(0);
  const [fase,            setFase]            = useState<FaseSimulacion>('inactivo');
  const [cargando,        setCargando]        = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [tab,             setTab]             = useState<Tab>('editor');
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const redActual = (): Red => ({ id: preset || 'red-001', nodos, aristas, version: 1 });

  function reiniciar() {
    pararIntervalo();
    setSimulacion(null); setPasoVisible(0); setFase('inactivo'); setError(null);
  }
  function pararIntervalo() {
    if (intervaloRef.current) { clearInterval(intervaloRef.current); intervaloRef.current = null; }
  }

  const cargarPreset = (nombre: string) => {
    const p = PRESETS[nombre]; if (!p) return;
    setNodos([...p.nodos]); setAristas([...p.aristas]);
    const vars: Variable[] = p.nodos
      .filter(n => n.valor && /^[A-Za-z][0-9]*$/.test(n.etiqueta))
      .map(n => ({ nombre: n.etiqueta, valor: n.valor as ValorBelnap }));
    setVariables(vars); setPreset(nombre); setNodoSelec(null); reiniciar();
  };

  // ── Variables ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const agregarVariable = useCallback((variable: Variable, nodo: Nodo) => {
    setVariables(v => [...v, variable]);
    setNodos(p => [...p, nodo]);
    reiniciar();
  }, []);

  const eliminarVariable = useCallback((nombre: string) => {
    setVariables(v => v.filter(x => x.nombre !== nombre));
    setNodos(p => {
      const nid = p.find(n => n.etiqueta === nombre && n.valor !== undefined)?.id;
      if (nid) setAristas(a => a.filter(ar => ar.idOrigen !== nid && ar.idDestino !== nid));
      return p.filter(n => !(n.etiqueta === nombre && n.valor !== undefined));
    });
    reiniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Nodos ──────────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const agregarNodo   = useCallback((n: Nodo) => { setNodos(p => [...p, n]); reiniciar(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const agregarArista = useCallback((a: Arista) => { setAristas(p => [...p, a]); reiniciar(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const eliminarNodo  = useCallback((id: string) => {
    setNodos(p => p.filter(n => n.id !== id));
    setAristas(p => p.filter(a => a.idOrigen !== id && a.idDestino !== id));
    if (nodoSelec === id) setNodoSelec(null);
    reiniciar();
  }, [nodoSelec]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const eliminarArista = useCallback((id: string) => { setAristas(p => p.filter(a => a.id !== id)); reiniciar(); }, []);
  const moverNodo = useCallback((id: string, pos: { x: number; y: number }) => {
    setNodos(p => p.map(n => n.id === id ? { ...n, posicion: pos } : n));
  }, []);

  /** Asigna o quita el valor de un nodo (usado desde el picker del panel derecho) */
  const asignarValorNodo = useCallback((id: string, valor: ValorBelnap | null) => {
    setNodos(p => p.map(n => n.id === id ? { ...n, valor: valor ?? undefined } : n));
    // Si es un nodo que corresponde a una variable, actualizar también el valor de la variable
    setNodos(current => {
      const nodo = current.find(n => n.id === id);
      if (nodo) {
        setVariables(vs => vs.map(v =>
          v.nombre === nodo.etiqueta ? { ...v, valor: valor ?? v.valor } : v
        ));
      }
      return current;
    });
    reiniciar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Simulación ─────────────────────────────────────────────────────────────
  const simular = async () => {
    if (nodos.length === 0)   { setError('Agrega nodos primero.'); return; }
    if (!nodos.some(n => n.valor)) { setError('Asigna un valor a al menos un nodo (clic en el nodo).'); return; }
    setCargando(true); setError(null); pararIntervalo();
    try {
      const res = await iniciarSimulacion(redActual());
      setSimulacion(res);
      setPasoVisible(res.historial.length - 1);
      setFase(res.historial[res.historial.length-1]?.convergido ? 'completado' : 'error');
      setTab('resultados');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setCargando(false); }
  };

  const handlePlay = () => {
    if (!simulacion) return;
    pararIntervalo(); setFase('corriendo'); setPasoVisible(0);
    let paso = 0;
    intervaloRef.current = setInterval(() => {
      paso++;
      if (paso >= simulacion.historial.length) {
        pararIntervalo(); setFase('completado'); setPasoVisible(simulacion.historial.length - 1);
      } else setPasoVisible(paso);
    }, 900);
  };
  const handlePausar     = () => { pararIntervalo(); setFase('pausado'); };
  const handlePaso       = () => { pararIntervalo(); setFase('pausado'); setPasoVisible(p => Math.min(p+1, (simulacion?.historial.length??1)-1)); };
  const handleRetroceder = () => { pararIntervalo(); setFase('pausado'); setPasoVisible(p => Math.max(p-1,0)); };

  useEffect(() => () => pararIntervalo(), []);

  const resultadoVisible = simulacion?.historial[pasoVisible] ?? null;
  const totalPasos       = simulacion?.historial.length ?? 0;
  const nodosConValor: NodoConValor[] = nodos.map(n => ({
    ...n, valorActual: (resultadoVisible?.valoresNodos[n.id] ?? n.valor ?? 'N') as ValorBelnap,
  }));
  // Nodo que cambió en el paso actual (para resaltarlo en el canvas)
  const pasoPrevio = pasoVisible > 0 ? (simulacion?.historial[pasoVisible-1] ?? null) : null;
  const nodoCambio: string | null = (() => {
    if (!pasoPrevio || !resultadoVisible) return null;
    for (const n of nodos) {
      if ((pasoPrevio.valoresNodos[n.id] ?? 'N') !== (resultadoVisible.valoresNodos[n.id] ?? 'N')) return n.id;
    }
    return null;
  })();

  const nodoSelecObj = nodos.find(n => n.id === nodoSelec) ?? null;

  return (
    <div style={{ minHeight:'100vh', background:PALETA.fondo, color:'#f1f5f9', fontFamily:'Segoe UI,system-ui,sans-serif' }}>

      {/* Header */}
      <header style={{ height:64, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 28px', background:PALETA.header, boxShadow:'0 2px 20px rgba(0,0,0,.5)' }}>
        <h1 style={{ fontSize:22, fontWeight:800 }}>
          EPiC <span style={{ color:PALETA.acento }}>Playground</span>
          <span style={{ fontSize:11, color:'#64748b', fontWeight:400, marginLeft:10 }}>Propagación de evidencia · Belnap</span>
        </h1>
        <div style={{ display:'flex', gap:6 }}>
          <span style={{ fontSize:11, color:'#64748b', alignSelf:'center' }}>Presets:</span>
          {Object.keys(PRESETS).map(k => (
            <button key={k} onClick={() => cargarPreset(k)} style={{
              background:preset===k?PALETA.acento:'#162849', border:'none', color:'white',
              borderRadius:8, padding:'5px 12px', fontSize:11, cursor:'pointer', fontWeight:preset===k?700:400,
            }}>{k}</button>
          ))}
          <button onClick={() => { setNodos([]); setAristas([]); setVariables([]); setPreset(''); setNodoSelec(null); reiniciar(); }}
            style={{ background:'#1e293b', border:'none', color:'#94a3b8', borderRadius:8, padding:'5px 10px', fontSize:11, cursor:'pointer' }}>
            ✕ Limpiar
          </button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {(['T','F','B','N'] as ValorBelnap[]).map(v => (
            <div key={v} style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:COLOR_BELNAP[v],
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:'bold', color:'white' }}>{v}</div>
              <span style={{ fontSize:10, color:'#64748b' }}>{DESC_BELNAP[v]}</span>
            </div>
          ))}
        </div>
      </header>

      {error && (
        <div style={{ background:'#450a0a', color:'#fca5a5', padding:'8px 28px', fontSize:12 }}>
          ⚠ {error}
          <button onClick={() => setError(null)} style={{ marginLeft:10, background:'none', border:'none', color:'#f87171', cursor:'pointer' }}>✕</button>
        </div>
      )}

      <main style={{ display:'flex', gap:18, padding:18, height:'calc(100vh - 64px)', boxSizing:'border-box' }}>

        {/* Canvas */}
        <div style={{ flex:3, display:'flex', flexDirection:'column', gap:8 }}>
          <CanvasEditor nodos={nodos} aristas={aristas}
            nodosConValor={resultadoVisible ? nodosConValor : undefined}
            nodoCambio={resultadoVisible ? nodoCambio : null}
            nodoSeleccionado={nodoSelec}
            onSeleccionarNodo={setNodoSelec}
            onMoverNodo={moverNodo}
            onEliminarNodo={eliminarNodo}
            onEliminarArista={eliminarArista} />

          {/* Barra de iteraciones */}
          {simulacion && totalPasos > 1 && (
            <div style={{ display:'flex', gap:4, alignItems:'center', justifyContent:'center' }}>
              {simulacion.historial.map((p, i) => (
                <button key={i} onClick={() => { pararIntervalo(); setFase('pausado'); setPasoVisible(i); }}
                  style={{ width:26, height:26, borderRadius:'50%', border:'none', cursor:'pointer',
                    background:i===pasoVisible?PALETA.acento:'#162849', color:'white',
                    fontSize:11, fontWeight:i===pasoVisible?700:400 }}
                  title={p.iteraciones===0?'Estado inicial':`Iteración ${p.iteraciones}${p.convergido?' ✓':''}`}>
                  {p.iteraciones}
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize:10, color:'#1e293b', textAlign:'center' }}>
            Clic en nodo para asignar valor · Arrastra para mover · Doble clic elimina · Clic en arista la elimina
          </div>
        </div>

        {/* Panel derecho */}
        <aside style={{ width:310, display:'flex', flexDirection:'column', gap:12, overflowY:'auto' }}>
          <div style={{ display:'flex', background:'#0f1f3d', borderRadius:10, padding:4 }}>
            {(['editor','resultados'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, background:tab===t?PALETA.acento:'transparent', border:'none',
                color:'white', borderRadius:7, padding:'6px 0', fontSize:12,
                fontWeight:tab===t?700:400, cursor:'pointer',
              }}>{t==='editor'?'✏ Editor':'📊 Simulación'}</button>
            ))}
          </div>

          {tab==='editor' && (
            <>
              {/* ── Nodo seleccionado: picker de valor ─────────────────── */}
              {nodoSelecObj && (
                <Section titulo={`Nodo seleccionado: "${nodoSelecObj.etiqueta}"`}>
                  <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>
                    Asigna un valor de partida para la propagación (o quítalo):
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5 }}>
                    {/* Quitar valor */}
                    <button onClick={() => asignarValorNodo(nodoSelecObj.id, null)} style={{
                      background: !nodoSelecObj.valor ? '#6366f1' : '#0f1f3d',
                      border:`2px solid ${!nodoSelecObj.valor ? '#6366f1' : '#1e3a5f'}`,
                      color:'white', borderRadius:8, padding:'8px 2px', cursor:'pointer',
                      fontSize:11, fontWeight:!nodoSelecObj.valor?700:400,
                    }}>—</button>
                    {VALORES_BELNAP.map(v => (
                      <button key={v} onClick={() => asignarValorNodo(nodoSelecObj.id, v)} style={{
                        background: nodoSelecObj.valor===v ? COLOR_BELNAP[v] : '#0f1f3d',
                        border:`2px solid ${nodoSelecObj.valor===v ? COLOR_BELNAP[v] : '#1e3a5f'}`,
                        color:'white', borderRadius:8, padding:'8px 2px', cursor:'pointer',
                        fontSize:13, fontWeight:nodoSelecObj.valor===v?700:400,
                      }} title={DESC_BELNAP[v]}>{v}</button>
                    ))}
                  </div>
                  {nodoSelecObj.valor && (
                    <div style={{ fontSize:11, color:COLOR_BELNAP[nodoSelecObj.valor as ValorBelnap], marginTop:6, textAlign:'center' }}>
                      Valor actual: {nodoSelecObj.valor} — {DESC_BELNAP[nodoSelecObj.valor as ValorBelnap]}
                    </div>
                  )}
                </Section>
              )}

              {!nodoSelecObj && nodos.length > 0 && (
                <div style={{ background:'#0f1f3d', borderRadius:10, padding:'10px 12px',
                  fontSize:11, color:'#64748b', textAlign:'center' }}>
                  Haz <strong style={{ color:'white' }}>clic en un nodo</strong> del canvas para asignarle un valor de partida
                </div>
              )}

              <Section titulo="① Variables (con valor asignado)">
                <FormularioVariable variables={variables} cantidadNodos={nodos.length}
                  onAgregar={agregarVariable} onEliminar={eliminarVariable} />
              </Section>

              <Section titulo="② Nodos compuestos (fórmulas)">
                <FormularioNodo variables={variables} cantidadNodos={nodos.length} onAgregar={agregarNodo} />
              </Section>

              <Section titulo="③ Conexiones (automáticas)">
                <FormularioArista nodos={nodos} cantidadAristas={aristas.length} onAgregar={agregarArista} />
              </Section>

              <button onClick={simular} disabled={cargando || nodos.length===0} style={{
                background:PALETA.acento, border:'none', color:'white', borderRadius:10,
                padding:'12px 0', fontSize:14, fontWeight:700, cursor:'pointer',
                opacity:nodos.length===0?0.4:1,
              }}>
                {cargando ? '⏳ Propagando...' : '▶ Propagar evidencia'}
              </button>
            </>
          )}

          {tab==='resultados' && (
            <>
              <Section titulo="Controles">
                <ControlesSimulacion fase={fase} pasoActual={pasoVisible} totalPasos={totalPasos}
                  cargando={cargando} onSimular={simular} onPlay={handlePlay}
                  onPausar={handlePausar} onPaso={handlePaso}
                  onRetroceder={handleRetroceder} onReiniciar={reiniciar} />
              </Section>
              {resultadoVisible
                ? <PanelResultados
                    nodos={nodosConValor}
                    pasoActual={resultadoVisible}
                    pasoPrevio={pasoVisible > 0 ? (simulacion?.historial[pasoVisible-1] ?? null) : null}
                  />
                : <div style={{ textAlign:'center', color:'#334155', fontSize:13, paddingTop:20 }}>Presiona «▶ Propagar evidencia»</div>
              }
            </>
          )}
        </aside>
      </main>
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'#162849', borderRadius:14, padding:'12px 14px' }}>
      <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>{titulo}</div>
      {children}
    </div>
  );
}
