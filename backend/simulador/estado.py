"""
estado.py — Almacén en memoria del ciclo de vida de cada simulación.

Responsabilidad única: mantener el mapa {sim_id -> EstadoSimulacion} y
exponer operaciones atómicas sobre él. No sabe nada del Motor ni de HTTP.
"""

from __future__ import annotations

import uuid

from compartido.modelos import EstadoSimulacion, ResultadoPropagacion
from compartido.contratos import FaseSimulacion


class GestorEstadoSimulacion:

    def __init__(self) -> None:
        self._estados: dict[str, EstadoSimulacion] = {}

    def crear(self) -> tuple[str, EstadoSimulacion]:
        sim_id = str(uuid.uuid4())
        estado = EstadoSimulacion(fase=FaseSimulacion.INACTIVO.value)
        self._estados[sim_id] = estado
        return sim_id, estado

    def obtener(self, sim_id: str) -> EstadoSimulacion:
        if sim_id not in self._estados:
            raise KeyError(f'Simulación "{sim_id}" no encontrada')
        return self._estados[sim_id]

    def existe(self, sim_id: str) -> bool:
        return sim_id in self._estados

    def actualizar_fase(self, sim_id: str, fase: FaseSimulacion) -> None:
        self.obtener(sim_id).fase = fase.value

    def establecer_historial(self, sim_id: str, historial: list[ResultadoPropagacion]) -> None:
        estado = self.obtener(sim_id)
        estado.historial = historial
        estado.paso_actual = 0

    def avanzar_paso(self, sim_id: str) -> bool:
        """Mueve el puntero pasoActual al siguiente paso del historial ya calculado.
        Retorna True si avanzó, False si ya estaba en el último paso."""
        estado = self.obtener(sim_id)
        if estado.paso_actual < len(estado.historial) - 1:
            estado.paso_actual += 1
            return True
        return False

    def retroceder_paso(self, sim_id: str) -> bool:
        estado = self.obtener(sim_id)
        if estado.paso_actual > 0:
            estado.paso_actual -= 1
            return True
        return False
