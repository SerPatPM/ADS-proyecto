"""
validadores.py — Validación del nuevo modelo de grafo EPiC.
"""
from __future__ import annotations
from compartido.modelos import Nodo, Arista, Red, ErrorValidacion, VALORES_BELNAP
from compartido.contratos import TIPOS_ARISTA


def validar_nodo(nodo: Nodo, ids: set[str] | None = None) -> list[ErrorValidacion]:
    errores: list[ErrorValidacion] = []
    if not nodo.id or not nodo.id.startswith("nodo-"):
        errores.append(ErrorValidacion("NODO_FORMATO", f'ID "{nodo.id}" debe ser "nodo-*"', nodo.id))
    if ids and nodo.id in ids:
        errores.append(ErrorValidacion("NODO_DUPLICADO", f'ID "{nodo.id}" duplicado', nodo.id))
    if not nodo.etiqueta or not nodo.etiqueta.strip():
        errores.append(ErrorValidacion("NODO_SIN_ETIQUETA", f'Nodo "{nodo.id}" sin etiqueta', nodo.id))
    if nodo.valor is not None and nodo.valor not in VALORES_BELNAP:
        errores.append(ErrorValidacion("VALOR_INVALIDO",
            f'Valor "{nodo.valor}" en "{nodo.id}" debe ser T, F, B o N', nodo.id))
    return errores


def validar_arista(a: Arista, ids: set[str], ids_a: set[str] | None = None) -> list[ErrorValidacion]:
    errores: list[ErrorValidacion] = []
    if not a.id or not a.id.startswith("arista-"):
        errores.append(ErrorValidacion("ARISTA_FORMATO", f'ID "{a.id}" debe ser "arista-*"', arista_id=a.id))
    if ids_a and a.id in ids_a:
        errores.append(ErrorValidacion("ARISTA_DUPLICADA", f'ID "{a.id}" duplicado', arista_id=a.id))
    if a.tipo not in TIPOS_ARISTA:
        errores.append(ErrorValidacion("TIPO_ARISTA_INVALIDO",
            f'Tipo "{a.tipo}" no válido. Usa: {sorted(TIPOS_ARISTA)}', arista_id=a.id))
    if a.id_origen not in ids:
        errores.append(ErrorValidacion("ORIGEN_INEXISTENTE", f'Nodo "{a.id_origen}" no existe', arista_id=a.id))
    if a.id_destino not in ids:
        errores.append(ErrorValidacion("DESTINO_INEXISTENTE", f'Nodo "{a.id_destino}" no existe', arista_id=a.id))
    if a.id_origen == a.id_destino:
        errores.append(ErrorValidacion("AUTO_LOOP", f'Arista "{a.id}" conecta un nodo consigo mismo', arista_id=a.id))
    return errores


def validar_red(red: Red) -> list[ErrorValidacion]:
    errores: list[ErrorValidacion] = []
    if not red.id:
        errores.append(ErrorValidacion("RED_SIN_ID", "La red no tiene id"))
    if not red.nodos:
        errores.append(ErrorValidacion("GRAFO_VACIO", "La red no tiene nodos"))
        return errores

    ids_n: set[str] = set()
    ids_a: set[str] = set()

    for n in red.nodos:
        errores.extend(validar_nodo(n, ids_n))
        if n.id: ids_n.add(n.id)

    for a in red.aristas:
        errores.extend(validar_arista(a, ids_n, ids_a))
        if a.id: ids_a.add(a.id)

    # Al menos un nodo debe tener valor asignado para iniciar propagación
    if not any(n.tiene_valor for n in red.nodos):
        errores.append(ErrorValidacion("SIN_VALORES_ASIGNADOS",
            "Asigna un valor (T/F/B/N) a al menos un nodo para iniciar la propagación"))

    return errores
