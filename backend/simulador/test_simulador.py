"""
test_simulador.py — Tests del Simulador con Motor mockeado.
"""

import pytest
from unittest.mock import MagicMock

from compartido.modelos import Red, Nodo, Arista, ResultadoPropagacion
from compartido.contratos import FaseSimulacion, IMotorCalculoIterativo, RedInvalidaError
from simulador.estado import GestorEstadoSimulacion
from simulador.servicio import SimulacionServicio


def _red_valida() -> Red:
    return Red(id="red-001", nodos=[
        Nodo(id="nodo-P",  etiqueta="P", tipo="premisa", propiedades={"valor": "T"}),
        Nodo(id="nodo-A",  etiqueta="A", tipo="AND",     propiedades={}),
    ], aristas=[
        Arista(id="arista-001", id_origen="nodo-P", id_destino="nodo-A"),
    ])


def _pasos_mock(n: int = 3) -> list[ResultadoPropagacion]:
    return [
        ResultadoPropagacion(
            red_id="red-001", iteraciones=i + 1,
            valores_nodos={"nodo-P": "T", "nodo-A": "T" if i > 0 else "N"},
            convergido=(i == n - 1), error=None,
        )
        for i in range(n)
    ]


def _servicio(pasos=None):
    motor = MagicMock(spec=IMotorCalculoIterativo)
    motor.calcular_pasos.return_value = pasos or _pasos_mock()
    fabrica = MagicMock(return_value=motor)
    gestor = GestorEstadoSimulacion()
    return SimulacionServicio(fabrica_motor=fabrica, gestor=gestor), fabrica, motor, gestor


class TestIniciar:
    def test_retorna_id_de_simulacion(self):
        srv, *_ = _servicio()
        assert _servicio()[0].iniciar(_red_valida()) != ""

    def test_llama_calcular_pasos_una_vez(self):
        srv, _, motor, _ = _servicio()
        srv.iniciar(_red_valida())
        motor.calcular_pasos.assert_called_once()

    def test_fase_completado_al_terminar(self):
        srv, *_, gestor = _servicio()
        sim_id = srv.iniciar(_red_valida())
        assert gestor.obtener(sim_id).fase == FaseSimulacion.COMPLETADO.value

    def test_historial_guarda_todos_los_pasos(self):
        srv, *_, gestor = _servicio(_pasos_mock(5))
        sim_id = srv.iniciar(_red_valida())
        assert len(gestor.obtener(sim_id).historial) == 5

    def test_red_invalida_no_llama_al_motor(self):
        srv, _, motor, _ = _servicio()
        red_vacia = Red(id="x", nodos=[], aristas=[])
        with pytest.raises(RedInvalidaError):
            srv.iniciar(red_vacia)
        motor.calcular_pasos.assert_not_called()

    def test_fase_error_si_motor_reporta_error(self):
        pasos_error = [ResultadoPropagacion(
            red_id="red-001", iteraciones=0, valores_nodos={},
            convergido=False, error="error de prueba",
        )]
        srv, *_, gestor = _servicio(pasos_error)
        sim_id = srv.iniciar(_red_valida())
        assert gestor.obtener(sim_id).fase == FaseSimulacion.ERROR.value


class TestNavegacion:
    def test_avanzar_mueve_paso_actual(self):
        srv, *_, gestor = _servicio(_pasos_mock(3))
        sim_id = srv.iniciar(_red_valida())
        srv.avanzar_paso_por_id(sim_id)
        assert gestor.obtener(sim_id).paso_actual == 1

    def test_retroceder_vuelve_al_paso_anterior(self):
        srv, *_, gestor = _servicio(_pasos_mock(3))
        sim_id = srv.iniciar(_red_valida())
        srv.avanzar_paso_por_id(sim_id)
        srv.avanzar_paso_por_id(sim_id)
        srv.retroceder_paso_por_id(sim_id)
        assert gestor.obtener(sim_id).paso_actual == 1

    def test_avanzar_en_ultimo_retorna_false(self):
        srv, *_ = _servicio(_pasos_mock(1))
        sim_id = srv.iniciar(_red_valida())
        assert srv.avanzar_paso_por_id(sim_id) is False

    def test_pausar_y_reanudar(self):
        srv, *_, gestor = _servicio()
        sim_id = srv.iniciar(_red_valida())
        gestor.actualizar_fase(sim_id, FaseSimulacion.CORRIENDO)
        srv.pausar_por_id(sim_id)
        assert gestor.obtener(sim_id).fase == FaseSimulacion.PAUSADO.value
        srv.reanudar_por_id(sim_id)
        assert gestor.obtener(sim_id).fase == FaseSimulacion.CORRIENDO.value


class TestAislamiento:
    def test_dos_simulaciones_son_independientes(self):
        srv, *_, gestor = _servicio(_pasos_mock(3))
        id1 = srv.iniciar(_red_valida())
        id2 = srv.iniciar(_red_valida())
        srv.avanzar_paso_por_id(id1)
        assert gestor.obtener(id1).paso_actual == 1
        assert gestor.obtener(id2).paso_actual == 0
