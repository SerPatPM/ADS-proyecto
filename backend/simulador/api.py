from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from compartido.modelos import Red, Nodo, Arista, Posicion, EstadoSimulacion, ResultadoPropagacion
from compartido.contratos import RedInvalidaError
from motor.algoritmos import obtener_motor
from simulador.estado import GestorEstadoSimulacion
from simulador.servicio import SimulacionServicio

router = APIRouter()
_gestor   = GestorEstadoSimulacion()
_servicio = SimulacionServicio(fabrica_motor=lambda: obtener_motor(), gestor=_gestor)

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

class RedIn(BaseModel):
    id: str; nodos: list[NodoIn]; aristas: list[AristaIn]; version: Optional[int] = 1

class EntradaSimulacion(BaseModel):
    red: RedIn

class ResultadoOut(BaseModel):
    redId: str; iteraciones: int; valoresNodos: dict
    convergido: bool; error: Optional[str] = None
    descripcion: Optional[str] = None

class SalidaSimulacion(BaseModel):
    id: str; fase: str; pasoActual: int; historial: list[ResultadoOut]

class SalidaPaso(BaseModel):
    id: str; fase: str; pasoActual: int; avanzado: bool

def _a_red(r: RedIn) -> Red:
    nodos = [Nodo(id=n.id, etiqueta=n.etiqueta, valor=n.valor,
                  posicion=Posicion(x=n.posicion.x, y=n.posicion.y) if n.posicion else Posicion())
             for n in r.nodos]
    aristas = [Arista(id=a.id, id_origen=a.idOrigen, id_destino=a.idDestino,
                      tipo=a.tipo, metadatos=a.metadatos or {})
               for a in r.aristas]
    return Red(id=r.id, nodos=nodos, aristas=aristas, version=r.version or 1)

def _estado_out(sim_id: str, estado: EstadoSimulacion) -> SalidaSimulacion:
    return SalidaSimulacion(id=sim_id, fase=estado.fase, pasoActual=estado.paso_actual,
        historial=[ResultadoOut(redId=h.red_id, iteraciones=h.iteraciones,
            valoresNodos=h.valores_nodos, convergido=h.convergido, error=h.error,
            descripcion=h.descripcion)
            for h in estado.historial])

@router.post("/api/v1/simulaciones", response_model=SalidaSimulacion, status_code=201)
def post_iniciar(entrada: EntradaSimulacion):
    try:
        red    = _a_red(entrada.red)
        sim_id = _servicio.iniciar(red)
        return _estado_out(sim_id, _servicio.obtener_estado(sim_id))
    except RedInvalidaError as e: raise HTTPException(422, str(e))
    except Exception as e:        raise HTTPException(500, f"Error interno: {e}")

@router.get("/api/v1/simulaciones/{id}", response_model=SalidaSimulacion)
def get_simulacion(id: str):
    try:    return _estado_out(id, _servicio.obtener_estado(id))
    except KeyError: raise HTTPException(404)

@router.put("/api/v1/simulaciones/{id}/pausar")
def put_pausar(id: str):
    try:    _servicio.pausar_por_id(id); return {"id":id,"fase":_servicio.obtener_estado(id).fase}
    except KeyError: raise HTTPException(404)

@router.put("/api/v1/simulaciones/{id}/reanudar")
def put_reanudar(id: str):
    try:    _servicio.reanudar_por_id(id); return {"id":id,"fase":_servicio.obtener_estado(id).fase}
    except KeyError: raise HTTPException(404)

@router.put("/api/v1/simulaciones/{id}/avanzar", response_model=SalidaPaso)
def put_avanzar(id: str):
    try:
        avanzado = _servicio.avanzar_paso_por_id(id)
        estado   = _servicio.obtener_estado(id)
        return SalidaPaso(id=id, fase=estado.fase, pasoActual=estado.paso_actual, avanzado=avanzado)
    except KeyError: raise HTTPException(404)

@router.put("/api/v1/simulaciones/{id}/retroceder", response_model=SalidaPaso)
def put_retroceder(id: str):
    try:
        ret    = _servicio.retroceder_paso_por_id(id)
        estado = _servicio.obtener_estado(id)
        return SalidaPaso(id=id, fase=estado.fase, pasoActual=estado.paso_actual, avanzado=ret)
    except KeyError: raise HTTPException(404)
