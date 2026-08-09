"""
algoritmos.py — Motor granular de propagación EPiC.

Genera UN PASO por cada regla que dispara, de modo que el frontend
puede mostrar la propagación nodo a nodo, regla a regla.

Orden determinista de aplicación de reglas:
  1. AND  (∧E forward, ∧-neg backward, ∧I)
  2. OR   (∨I forward, ∨E backward, ∨-dual)
  3. NOT  (bidireccional)
  4. UI   (UI+ forward, UI- backward)

Dentro de cada tipo, los nodos se procesan en orden lexicográfico por ID.
"""
from __future__ import annotations
from compartido.contratos import IMotorCalculoIterativo
from compartido.modelos import Red, ResultadoPropagacion

MAX_ITERACIONES = 500

# ── Helpers de bitpair ────────────────────────────────────────────────────────

def has_pos(v: str) -> bool: return v in ("T","B")
def has_neg(v: str) -> bool: return v in ("F","B")
def add_pos(v: str) -> str:  return "T" if v=="N" else ("B" if v=="F" else v)
def add_neg(v: str) -> str:  return "F" if v=="N" else ("B" if v=="T" else v)


# ── Búsqueda del primer cambio aplicable ─────────────────────────────────────

def _primer_cambio(
    valores: dict[str, str],
    and_grupos: dict[str, list[str]],
    or_grupos:  dict[str, list[str]],
    not_pares:  list[tuple[str,str]],
    ui_edges:   list[tuple[str,str]],
    etq:        dict[str, str],
) -> tuple[str, str, str] | None:
    """Retorna (nodo_id, nuevo_valor, descripcion) del primer cambio posible, o None."""

    # ── AND ──────────────────────────────────────────────────────────────────
    for cmp_id in sorted(and_grupos):
        comp_ids = sorted(and_grupos[cmp_id])
        cv = valores[cmp_id]

        # ∧E forward: compound pos → cada componente pos
        if has_pos(cv):
            for cid in comp_ids:
                nv = add_pos(valores[cid])
                if nv != valores[cid]:
                    return cid, nv, f"∧E: {etq[cmp_id]}={cv} → {etq[cid]}={nv}"

        # ∧-neg backward: algún componente neg → compound neg
        for cid in comp_ids:
            if has_neg(valores[cid]):
                nv = add_neg(cv)
                if nv != cv:
                    return cmp_id, nv, f"∧-neg: {etq[cid]}={valores[cid]} → {etq[cmp_id]}={nv}"

        # ∧I: todos los componentes pos → compound pos
        if all(has_pos(valores[cid]) for cid in comp_ids):
            nv = add_pos(cv)
            if nv != cv:
                partes = " ∧ ".join(f"{etq[c]}=T" for c in comp_ids)
                return cmp_id, nv, f"∧I: {partes} → {etq[cmp_id]}={nv}"

    # ── OR ───────────────────────────────────────────────────────────────────
    for cmp_id in sorted(or_grupos):
        comp_ids = sorted(or_grupos[cmp_id])
        cv = valores[cmp_id]

        # ∨I forward: algún componente pos → compound pos
        for cid in comp_ids:
            if has_pos(valores[cid]):
                nv = add_pos(cv)
                if nv != cv:
                    return cmp_id, nv, f"∨I: {etq[cid]}={valores[cid]} → {etq[cmp_id]}={nv}"

        # ∨E backward: compound neg → cada componente neg
        if has_neg(cv):
            for cid in comp_ids:
                nv = add_neg(valores[cid])
                if nv != valores[cid]:
                    return cid, nv, f"∨E: {etq[cmp_id]}={cv} → {etq[cid]}={nv}"

        # ∨-dual: todos los componentes neg → compound neg
        if all(has_neg(valores[cid]) for cid in comp_ids):
            nv = add_neg(cv)
            if nv != cv:
                return cmp_id, nv, f"∨-dual: todos neg → {etq[cmp_id]}={nv}"

    # ── NOT (bidireccional) ───────────────────────────────────────────────────
    for id1, id2 in not_pares:
        v1, v2 = valores[id1], valores[id2]
        if has_pos(v1):
            nv = add_neg(v2)
            if nv != v2: return id2, nv, f"¬: {etq[id1]}=T → {etq[id2]}=F"
        if has_neg(v1):
            nv = add_pos(v2)
            if nv != v2: return id2, nv, f"¬: {etq[id1]}=F → {etq[id2]}=T"
        if has_pos(v2):
            nv = add_neg(v1)
            if nv != v1: return id1, nv, f"¬: {etq[id2]}=T → {etq[id1]}=F"
        if has_neg(v2):
            nv = add_pos(v1)
            if nv != v1: return id1, nv, f"¬: {etq[id2]}=F → {etq[id1]}=T"

    # ── UI ───────────────────────────────────────────────────────────────────
    for orig, dest in ui_edges:
        if has_pos(valores[orig]):
            nv = add_pos(valores[dest])
            if nv != valores[dest]: return dest, nv, f"UI+: {etq[orig]}=T → {etq[dest]}=T"
        if has_neg(valores[dest]):
            nv = add_neg(valores[orig])
            if nv != valores[orig]: return orig, nv, f"UI-: {etq[dest]}=F → {etq[orig]}=F"

    return None  # punto fijo


# ── Motor ─────────────────────────────────────────────────────────────────────

class MotorBitpair(IMotorCalculoIterativo):
    """
    Motor granular: genera UN paso por cada regla que dispara.
    El historial resultante muestra la propagación nodo a nodo.
    """

    def calcular(self, red: Red) -> ResultadoPropagacion:
        return self.calcular_pasos(red)[-1]

    def calcular_pasos(self, red: Red) -> list[ResultadoPropagacion]:
        ids = {n.id for n in red.nodos}
        for a in red.aristas:
            if a.id_origen not in ids or a.id_destino not in ids:
                return [ResultadoPropagacion(red_id=red.id,iteraciones=0,valores_nodos={},
                    convergido=False,error="Arista referencia nodo inexistente",
                    descripcion="Error de estructura")]

        # Mapas de conectividad
        and_grupos: dict[str, list[str]] = {}
        or_grupos:  dict[str, list[str]] = {}
        not_pares:  list[tuple[str,str]] = []
        ui_edges:   list[tuple[str,str]] = []

        for a in red.aristas:
            if   a.tipo == "and": and_grupos.setdefault(a.id_origen,[]).append(a.id_destino)
            elif a.tipo == "or":  or_grupos.setdefault(a.id_destino,[]).append(a.id_origen)
            elif a.tipo == "not": not_pares.append((a.id_origen, a.id_destino))
            elif a.tipo == "ui":  ui_edges.append((a.id_origen, a.id_destino))

        etq = {n.id: n.etiqueta for n in red.nodos}

        # Estado inicial
        valores: dict[str,str] = {
            n.id: (n.valor if n.tiene_valor else "N") for n in red.nodos
        }

        pasos: list[ResultadoPropagacion] = [ResultadoPropagacion(
            red_id=red.id, iteraciones=0,
            valores_nodos=dict(valores),
            convergido=False, error=None,
            descripcion="Estado inicial",
        )]

        for iteracion in range(1, MAX_ITERACIONES + 1):
            resultado = _primer_cambio(valores, and_grupos, or_grupos, not_pares, ui_edges, etq)
            if resultado is None:
                # Convergido: marcar el último paso
                ultimo = pasos[-1]
                pasos[-1] = ResultadoPropagacion(
                    red_id=ultimo.red_id, iteraciones=ultimo.iteraciones,
                    valores_nodos=ultimo.valores_nodos,
                    convergido=True, error=None, descripcion=ultimo.descripcion,
                )
                break

            nid, nuevo_valor, descripcion = resultado
            valores[nid] = nuevo_valor

            pasos.append(ResultadoPropagacion(
                red_id=red.id, iteraciones=iteracion,
                valores_nodos=dict(valores),
                convergido=False, error=None,
                descripcion=descripcion,
            ))
        else:
            # Máximo de iteraciones alcanzado
            pasos[-1] = ResultadoPropagacion(
                red_id=pasos[-1].red_id, iteraciones=pasos[-1].iteraciones,
                valores_nodos=pasos[-1].valores_nodos,
                convergido=True, error=None, descripcion=pasos[-1].descripcion,
            )

        return pasos


def obtener_motor() -> MotorBitpair:
    return MotorBitpair()
