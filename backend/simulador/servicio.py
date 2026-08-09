"""
simulador/servicio.py — SimulacionServicio (implementa ISimulacion).
Depende de IMotorCalculoIterativo por inyección (DIP), no del motor concreto.
"""

from __future__ import annotations
from typing import Callable

from compartido.modelos import Red, EstadoSimulacion
from compartido.contratos import ISimulacion, FaseSimulacion, IMotorCalculoIterativo, RedInvalidaError
from compartido.validadores import validar_red
from simulador.estado import GestorEstadoSimulacion

FabricaMotor = Callable[[], IMotorCalculoIterativo]


class SimulacionServicio(ISimulacion):

    def __init__(self, fabrica_motor: FabricaMotor, gestor: GestorEstadoSimulacion) -> None:
        self._fabrica_motor = fabrica_motor
        self._gestor        = gestor
        self._sim_id_activo: str | None = None

    def iniciar(self, red: Red) -> str:
        errores = validar_red(red)
        if errores:
            raise RedInvalidaError("; ".join(e.mensaje for e in errores))

        sim_id, _ = self._gestor.crear()
        self._sim_id_activo = sim_id
        self._gestor.actualizar_fase(sim_id, FaseSimulacion.CORRIENDO)

        motor = self._fabrica_motor()
        pasos = motor.calcular_pasos(red)

        self._gestor.establecer_historial(sim_id, pasos)

        ultimo     = pasos[-1]
        fase_final = FaseSimulacion.ERROR if ultimo.error else FaseSimulacion.COMPLETADO
        self._gestor.actualizar_fase(sim_id, fase_final)

        return sim_id

    def pausar(self) -> None:
        if self._sim_id_activo:
            self.pausar_por_id(self._sim_id_activo)

    def reanudar(self) -> None:
        if self._sim_id_activo:
            self.reanudar_por_id(self._sim_id_activo)

    def paso(self) -> None:
        if self._sim_id_activo:
            self.avanzar_paso_por_id(self._sim_id_activo)

    def pausar_por_id(self, sim_id: str) -> None:
        estado = self._gestor.obtener(sim_id)
        if estado.fase == FaseSimulacion.CORRIENDO.value:
            self._gestor.actualizar_fase(sim_id, FaseSimulacion.PAUSADO)

    def reanudar_por_id(self, sim_id: str) -> None:
        estado = self._gestor.obtener(sim_id)
        if estado.fase == FaseSimulacion.PAUSADO.value:
            self._gestor.actualizar_fase(sim_id, FaseSimulacion.CORRIENDO)

    def avanzar_paso_por_id(self, sim_id: str) -> bool:
        return self._gestor.avanzar_paso(sim_id)

    def retroceder_paso_por_id(self, sim_id: str) -> bool:
        return self._gestor.retroceder_paso(sim_id)

    def obtener_estado(self, sim_id: str) -> EstadoSimulacion:
        return self._gestor.obtener(sim_id)
