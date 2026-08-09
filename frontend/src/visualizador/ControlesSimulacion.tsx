import type { FaseSimulacion } from '../compartido/tipos';

interface Props {
  fase: FaseSimulacion; pasoActual: number; totalPasos: number; cargando: boolean;
  onSimular(): void; onPlay(): void; onPausar(): void;
  onPaso(): void; onRetroceder(): void; onReiniciar(): void;
}

export function ControlesSimulacion({ fase, pasoActual, totalPasos, cargando,
  onSimular, onPlay, onPausar, onPaso, onRetroceder, onReiniciar }: Props) {

  const corriendo = fase === 'corriendo';
  const hayPasos  = totalPasos > 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {/* Info de paso */}
      {hayPasos && (
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#94a3b8' }}>
          <span>Paso {pasoActual} de {totalPasos-1}</span>
          <span style={{ color: fase==='completado' ? '#22c55e' : '#6366f1', fontWeight:700 }}>
            {fase==='completado' ? '✓ Convergido' : fase==='corriendo' ? '▶ Reproduciendo' : fase}
          </span>
        </div>
      )}

      {/* Controles de navegación */}
      {hayPasos && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6 }}>
          <Btn onClick={onRetroceder} disabled={pasoActual<=0||corriendo} title="Paso anterior">⏮</Btn>
          {corriendo
            ? <Btn onClick={onPausar}>⏸ Pausar</Btn>
            : <Btn onClick={onPlay} disabled={!hayPasos} accent>▶ Play</Btn>
          }
          <Btn onClick={onPaso} disabled={pasoActual>=totalPasos-1||corriendo} title="Siguiente paso">⏭</Btn>
          <Btn onClick={onReiniciar} title="Volver al inicio">↺</Btn>
        </div>
      )}

      <Btn onClick={onSimular} disabled={cargando} accent={!hayPasos}>
        {cargando ? '⏳ Calculando...' : hayPasos ? '↺ Recalcular' : '▶ Propagar evidencia'}
      </Btn>
    </div>
  );
}

function Btn({ children, onClick, disabled=false, accent=false, title }:
  { children: React.ReactNode; onClick(): void; disabled?: boolean; accent?: boolean; title?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      background: accent ? '#6366f1' : '#0f1f3d',
      border: `1px solid ${accent ? '#6366f1' : '#1e3a5f'}`,
      color: disabled ? '#334155' : 'white', borderRadius:8, padding:'8px 4px',
      fontSize:12, cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: accent ? 700 : 400, transition:'background 0.2s',
    }}>{children}</button>
  );
}
