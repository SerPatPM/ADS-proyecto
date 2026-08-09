from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional

VALORES_BELNAP = {"T", "F", "B", "N"}

@dataclass
class Posicion:
    x: float = 0.0; y: float = 0.0
    def to_dict(self): return {"x": self.x, "y": self.y}
    @classmethod
    def from_dict(cls, d): return cls(x=float(d.get("x",0)), y=float(d.get("y",0)))

@dataclass
class Nodo:
    id: str; etiqueta: str; valor: Optional[str] = None
    posicion: Posicion = field(default_factory=Posicion)

    @property
    def tiene_valor(self): return self.valor is not None and self.valor in VALORES_BELNAP

    def to_dict(self):
        return {"id":self.id,"etiqueta":self.etiqueta,"valor":self.valor,"posicion":self.posicion.to_dict()}
    @classmethod
    def from_dict(cls, d):
        return cls(id=d["id"], etiqueta=d["etiqueta"], valor=d.get("valor"),
                   posicion=Posicion.from_dict(d.get("posicion",{})))

@dataclass
class Arista:
    id: str; id_origen: str; id_destino: str; tipo: str
    metadatos: dict = field(default_factory=dict)
    def to_dict(self):
        return {"id":self.id,"idOrigen":self.id_origen,"idDestino":self.id_destino,
                "tipo":self.tipo,"metadatos":dict(self.metadatos)}
    @classmethod
    def from_dict(cls, d):
        return cls(id=d["id"],id_origen=d["idOrigen"],id_destino=d["idDestino"],
                   tipo=d.get("tipo","ui"),metadatos=dict(d.get("metadatos",{})))

@dataclass
class Red:
    id: str; nodos: list[Nodo] = field(default_factory=list)
    aristas: list[Arista] = field(default_factory=list); version: int = 1
    def to_dict(self):
        return {"id":self.id,"nodos":[n.to_dict() for n in self.nodos],
                "aristas":[a.to_dict() for a in self.aristas],"version":self.version}
    @classmethod
    def from_dict(cls, d):
        return cls(id=d["id"],nodos=[Nodo.from_dict(n) for n in d.get("nodos",[])],
                   aristas=[Arista.from_dict(a) for a in d.get("aristas",[])],
                   version=int(d.get("version",1)))

@dataclass
class ResultadoPropagacion:
    """Un paso = una sola regla que disparó y cambió exactamente un nodo."""
    red_id: str; iteraciones: int = 0
    valores_nodos: dict = field(default_factory=dict)
    convergido: bool = False; error: Optional[str] = None
    descripcion: Optional[str] = None          # ← qué regla disparó en este paso

    def to_dict(self):
        return {"redId":self.red_id,"iteraciones":self.iteraciones,
                "valoresNodos":dict(self.valores_nodos),"convergido":self.convergido,
                "error":self.error,"descripcion":self.descripcion}
    @classmethod
    def from_dict(cls, d):
        return cls(red_id=d["redId"],iteraciones=int(d.get("iteraciones",0)),
                   valores_nodos=dict(d.get("valoresNodos",{})),
                   convergido=bool(d.get("convergido",False)),
                   error=d.get("error"),descripcion=d.get("descripcion"))

@dataclass
class EstadoSimulacion:
    fase: str; paso_actual: int = 0
    historial: list[ResultadoPropagacion] = field(default_factory=list)
    def to_dict(self):
        return {"fase":self.fase,"pasoActual":self.paso_actual,
                "historial":[h.to_dict() for h in self.historial]}

@dataclass
class ErrorValidacion:
    codigo: str; mensaje: str; nodo_id: Optional[str]=None; arista_id: Optional[str]=None
    def to_dict(self):
        d={"codigo":self.codigo,"mensaje":self.mensaje}
        if self.nodo_id:   d["nodoId"]=self.nodo_id
        if self.arista_id: d["aristaId"]=self.arista_id
        return d
