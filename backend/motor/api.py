from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from compartido.modelos import Red, Nodo, Arista, Posicion
from compartido.validadores import validar_red
from motor.algoritmos import obtener_motor

router = APIRouter()
_CACHE: dict[str, dict] = {}

class PosicionIn(BaseModel):
    x: float = 0.0; y: float = 0.0

class NodoIn(BaseModel):
    id: str; etiqueta: str
    valor: Optional[str] = None
    posicion: Optional[PosicionIn] = None

class AristaIn(BaseModel):
    id: str; idOrigen: str; idDestino: str
    tipo: str = "ui"
    metadatos: Optional[dict] = None

class EntradaCalculo(BaseModel):
    id: str; nodos: list[NodoIn]; aristas: list[AristaIn]; version: Optional[int] = 1

def _a_red(p: EntradaCalculo) -> Red:
    nodos = [Nodo(id=n.id, etiqueta=n.etiqueta, valor=n.valor,
                  posicion=Posicion(x=n.posicion.x, y=n.posicion.y) if n.posicion else Posicion())
             for n in p.nodos]
    aristas = [Arista(id=a.id, id_origen=a.idOrigen, id_destino=a.idDestino,
                      tipo=a.tipo, metadatos=a.metadatos or {})
               for a in p.aristas]
    return Red(id=p.id, nodos=nodos, aristas=aristas, version=p.version or 1)

@router.post("/api/v1/redes/{id}/calcular")
def post_calcular_red(id: str, payload: EntradaCalculo):
    if payload.id != id:
        raise HTTPException(400, "El id de la ruta no coincide con el body.")
    red = _a_red(payload)
    errores = validar_red(red)
    if errores:
        raise HTTPException(422, detail=[e.to_dict() for e in errores])
    resultado = obtener_motor().calcular(red)
    _CACHE[red.id] = resultado.to_dict()
    return resultado.to_dict()

@router.get("/api/v1/propagaciones/{id}")
def get_propagacion(id: str):
    r = _CACHE.get(id)
    if r is None:
        raise HTTPException(404, f'Sin resultado para la red "{id}".')
    return r
