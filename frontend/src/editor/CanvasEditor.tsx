/**
 * CanvasEditor.tsx
 *
 * - Clic simple en un nodo → lo selecciona (para asignar valor en el panel).
 * - Doble clic → elimina el nodo.
 * - Nodo seleccionado: borde blanco punteado.
 * - Etiqueta siempre visible y grande.
 * - Valor Belnap: badge pequeño en esquina superior derecha.
 */
import { useRef, useEffect, useCallback } from 'react';
import type { Nodo, Arista, NodoConValor, ValorBelnap } from '../compartido/tipos';
import { COLOR_BELNAP, COLOR_ARISTA, PALETA } from '../compartido/constantes';

const R = 42;

interface Props {
  nodos: Nodo[];
  aristas: Arista[];
  nodosConValor?: NodoConValor[];
  nodoCambio?: string | null;        // nodo que acaba de cambiar (resaltar)
  nodoSeleccionado?: string | null;
  onSeleccionarNodo: (id: string | null) => void;
  onMoverNodo: (id: string, pos: { x: number; y: number }) => void;
  onEliminarNodo: (id: string) => void;
  onEliminarArista: (id: string) => void;
}

export function CanvasEditor({
  nodos, aristas, nodosConValor,
  nodoCambio, nodoSeleccionado, onSeleccionarNodo,
  onMoverNodo, onEliminarNodo, onEliminarArista,
}: Props) {
  const svgRef      = useRef<SVGSVGElement>(null);
  const posRef      = useRef<Record<string, { x: number; y: number }>>({});
  const draggingRef = useRef<{ id: string; ox: number; oy: number; moved: boolean } | null>(null);

  useEffect(() => {
    posRef.current = Object.fromEntries(nodos.map(n => [n.id, n.posicion]));
  }, [nodos]);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current.moved = true;
      const rect = svg.getBoundingClientRect();
      const sx = svg.viewBox.baseVal.width  / rect.width;
      const sy = svg.viewBox.baseVal.height / rect.height;
      const nx = (e.clientX - rect.left) * sx - draggingRef.current.ox;
      const ny = (e.clientY - rect.top)  * sy - draggingRef.current.oy;
      posRef.current[draggingRef.current.id] = { x: nx, y: ny };
      svg.querySelector<SVGGElement>(`[data-nid="${draggingRef.current.id}"]`)
         ?.setAttribute('transform', `translate(${nx},${ny})`);
    };
    const onUp = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const { id, moved } = draggingRef.current;
      draggingRef.current = null;
      if (moved) {
        onMoverNodo(id, posRef.current[id] ?? { x: 0, y: 0 });
      }
      e.stopPropagation();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onMoverNodo]);

  const onNodoDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    const svg = svgRef.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx   = svg.viewBox.baseVal.width  / rect.width;
    const sy   = svg.viewBox.baseVal.height / rect.height;
    const pos  = posRef.current[id] ?? { x: 0, y: 0 };
    draggingRef.current = {
      id, moved: false,
      ox: (e.clientX - rect.left) * sx - pos.x,
      oy: (e.clientY - rect.top)  * sy - pos.y,
    };
  }, []);

  const onNodoClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Solo seleccionar si no fue un drag
    if (!draggingRef.current?.moved) {
      onSeleccionarNodo(nodoSeleccionado === id ? null : id);
    }
  }, [nodoSeleccionado, onSeleccionarNodo]);

  // Click en el SVG vacío → deseleccionar
  const onSvgClick = useCallback(() => onSeleccionarNodo(null), [onSeleccionarNodo]);

  const valMap: Record<string, ValorBelnap> = {};
  if (nodosConValor) for (const n of nodosConValor) valMap[n.id] = n.valorActual;
  const enSim = (nodosConValor?.length ?? 0) > 0;

  const fontSz = (s: string) =>
    s.length <= 2 ? 22 : s.length <= 4 ? 17 : s.length <= 6 ? 14 : s.length <= 9 ? 11 : 9;

  return (
    <svg ref={svgRef} viewBox="0 0 860 520" onClick={onSvgClick}
      style={{ width: '100%', background: PALETA.elevado, borderRadius: 16, display: 'block', minHeight: 340 }}>
      <defs>
        <marker id="arr-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0,10 3.5,0 7" fill="#22c55e" />
        </marker>
        <marker id="arr-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0,10 3.5,0 7" fill="#ef4444" />
        </marker>
        <marker id="arr-red-start" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <polygon points="10 0,0 3.5,10 7" fill="#ef4444" />
        </marker>
      </defs>

      {/* ── Aristas ────────────────────────────────────────────────────── */}
      {aristas.map(a => {
        const orig = nodos.find(n => n.id === a.idOrigen);
        const dest = nodos.find(n => n.id === a.idDestino);
        if (!orig || !dest) return null;
        const color = COLOR_ARISTA[a.tipo];
        const isNot = a.tipo === 'not';
        const dx = dest.posicion.x - orig.posicion.x;
        const dy = dest.posicion.y - orig.posicion.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const x1 = orig.posicion.x + dx/len*(R+2);
        const y1 = orig.posicion.y + dy/len*(R+2);
        const x2 = dest.posicion.x - dx/len*(R+10);
        const y2 = dest.posicion.y - dy/len*(R+10);
        return (
          <g key={a.id} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onEliminarArista(a.id); }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5}
              strokeDasharray={enSim ? '8 4' : undefined}
              style={enSim ? { animation: 'flujo 0.8s linear infinite' } : undefined}
              markerEnd={`url(#arr-${isNot ? 'red' : 'green'})`}
              markerStart={isNot ? 'url(#arr-red-start)' : undefined}
            />
            <text x={(x1+x2)/2} y={(y1+y2)/2-8} fill={color} fontSize={10}
              textAnchor="middle" style={{ pointerEvents: 'none', fontWeight: 'bold' }}>
              {a.tipo.toUpperCase()}
            </text>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={16} />
          </g>
        );
      })}

      {/* ── Nodos ──────────────────────────────────────────────────────── */}
      {nodos.map(n => {
        const valActual = enSim
          ? (valMap[n.id] ?? 'N')
          : (n.valor as ValorBelnap | undefined) ?? null;

        const esSel   = nodoSeleccionado === n.id;
        const esCambio = nodoCambio === n.id;
        const fill    = enSim && valActual ? COLOR_BELNAP[valActual] + '33' : PALETA.tarjeta;
        const stroke  = esSel ? '#ffffff' : esCambio ? COLOR_BELNAP[valActual ?? 'N'] : (enSim && valActual ? COLOR_BELNAP[valActual] : PALETA.borde);
        const strokeW = esSel ? 2.5 : esCambio ? 3.5 : 2;

        return (
          <g key={n.id} data-nid={n.id}
            transform={`translate(${n.posicion.x},${n.posicion.y})`}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onMouseDown={e => onNodoDown(e, n.id)}
            onClick={e => onNodoClick(e, n.id)}
            onDoubleClick={e => { e.stopPropagation(); onEliminarNodo(n.id); }}>

            <circle r={R} fill={fill} stroke={stroke} strokeWidth={strokeW}
              strokeDasharray={esSel ? '5 3' : undefined} />
            {/* Anillo pulsante en el nodo que acabó de cambiar */}
            {esCambio && (
              <circle r={R+6} fill="none"
                stroke={COLOR_BELNAP[valActual ?? 'N']} strokeWidth={2} opacity={0.5}
                style={{ animation: 'pulso 0.8s ease-out' }} />
            )}

            {/* Etiqueta SIEMPRE PROMINENTE */}
            <text textAnchor="middle" dominantBaseline="middle" y={0}
              fill="white" fontSize={fontSz(n.etiqueta)} fontWeight="bold"
              style={{ pointerEvents: 'none' }}>
              {n.etiqueta}
            </text>

            {/* Badge de valor — esquina superior derecha */}
            {valActual && (
              <g transform={`translate(${R * 0.68}, ${-R * 0.68})`}>
                <circle r={11} fill={COLOR_BELNAP[valActual]} stroke={PALETA.elevado} strokeWidth={2} />
                <text textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize={9} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                  {valActual}
                </text>
              </g>
            )}

            {/* "sin valor" si no tiene ninguno */}
            {!valActual && (
              <text textAnchor="middle" y={R+14} fill="#334155" fontSize={9}
                style={{ pointerEvents: 'none' }}>sin valor</text>
            )}
          </g>
        );
      })}

      {nodos.length === 0 && (
        <text x={430} y={260} textAnchor="middle" fill="#334155" fontSize={15}>
          Declara variables y agrega nodos con el panel derecho
        </text>
      )}
      <style>{`
        @keyframes flujo{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}
        @keyframes pulso{from{r:${R+6}px;opacity:0.6}to{r:${R+18}px;opacity:0}}
      `}</style>
    </svg>
  );
}
